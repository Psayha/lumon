import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * SECURITY: CSRF Protection Middleware
 *
 * Validates Origin/Referer headers for state-changing requests (POST, PUT, DELETE, PATCH)
 * Prevents Cross-Site Request Forgery attacks by ensuring requests come from allowed origins
 *
 * Defense layers:
 * 1. Origin header validation (preferred)
 * 2. Referer header validation (fallback)
 * 3. CORS policy (configured in main.ts)
 * 4. Bearer token requirement (prevents simple form-based CSRF)
 */
@Injectable()
export class CsrfProtectionMiddleware implements NestMiddleware {
  private allowedOrigins: Set<string>;

  constructor() {
    // Load allowed origins from environment
    const corsOriginsEnv = process.env.CORS_ORIGINS;

    const origins = corsOriginsEnv
      ? corsOriginsEnv.split(',').map(origin => origin.trim())
      : process.env.NODE_ENV === 'production'
      ? []
      : [
          'http://localhost:5173',
          'http://localhost:3000',
        ];

    this.allowedOrigins = new Set(origins);
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Only check state-changing methods
    const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (!stateChangingMethods.includes(req.method)) {
      return next();
    }

    // Skip CSRF check for health endpoints (monitoring tools)
    if (req.path.startsWith('/health')) {
      return next();
    }

    // Get Origin or Referer header
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // SECURITY: Validate Origin header (preferred method)
    if (origin) {
      if (!this.isOriginAllowed(origin)) {
        console.warn(`[CSRF] Blocked request from unauthorized origin: ${origin}`);
        throw new ForbiddenException(
          'Invalid origin. Cross-site requests are not allowed.',
        );
      }
      return next();
    }

    // SECURITY: Fallback to Referer header validation
    if (referer) {
      const refererOrigin = this.extractOriginFromReferer(referer);
      if (refererOrigin && this.isOriginAllowed(refererOrigin)) {
        return next();
      }
      console.warn(`[CSRF] Blocked request with invalid referer: ${referer}`);
      throw new ForbiddenException(
        'Invalid referer. Cross-site requests are not allowed.',
      );
    }

    // SECURITY: For production, require Origin or Referer header
    // For development, allow requests without these headers (e.g., API testing tools)
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        `[CSRF] Blocked request without Origin or Referer header: ${req.method} ${req.path}`,
      );
      throw new ForbiddenException(
        'Missing Origin or Referer header. Cross-site requests require proper headers.',
      );
    }

    // Development: allow without Origin/Referer (for Postman, curl, etc.)
    next();
  }

  /**
   * Check if origin is in the allowed list
   */
  private isOriginAllowed(origin: string): boolean {
    // Exact match
    if (this.allowedOrigins.has(origin)) {
      return true;
    }

    // For development, also allow localhost with any port
    if (process.env.NODE_ENV !== 'production') {
      try {
        const url = new URL(origin);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return true;
        }
      } catch {
        // Invalid URL, reject
        return false;
      }
    }

    return false;
  }

  /**
   * Extract origin from referer URL
   * Example: https://example.com/path -> https://example.com
   */
  private extractOriginFromReferer(referer: string): string | null {
    try {
      const url = new URL(referer);
      return `${url.protocol}//${url.host}`;
    } catch {
      return null;
    }
  }
}
