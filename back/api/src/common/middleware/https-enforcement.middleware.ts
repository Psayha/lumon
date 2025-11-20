import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * SECURITY: HTTPS Enforcement Middleware
 *
 * Forces HTTPS in production by redirecting HTTP requests to HTTPS.
 * Prevents man-in-the-middle attacks and credential theft.
 *
 * NOTE: This middleware should be used behind a reverse proxy (nginx/traefik)
 * that handles SSL termination and sets X-Forwarded-Proto header.
 */
@Injectable()
export class HttpsEnforcementMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip HTTPS enforcement in development
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // Skip HTTPS enforcement if explicitly disabled
    if (process.env.DISABLE_HTTPS_ENFORCEMENT === 'true') {
      return next();
    }

    // Check if request is already HTTPS
    const isHttps = this.isSecureRequest(req);

    if (!isHttps) {
      // Get the full URL to redirect to HTTPS
      const httpsUrl = `https://${req.hostname}${req.url}`;

      // Send 301 Permanent Redirect to HTTPS
      return res.redirect(301, httpsUrl);
    }

    // Add HSTS header to enforce HTTPS for future requests
    // max-age=31536000 = 1 year
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );

    next();
  }

  /**
   * Determines if the request is secure (HTTPS)
   * Checks multiple headers set by reverse proxies
   */
  private isSecureRequest(req: Request): boolean {
    // Direct HTTPS connection
    if (req.secure || req.protocol === 'https') {
      return true;
    }

    // Check X-Forwarded-Proto header (set by reverse proxy)
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (forwardedProto === 'https') {
      return true;
    }

    // Check X-Forwarded-Ssl header (alternative header)
    const forwardedSsl = req.headers['x-forwarded-ssl'];
    if (forwardedSsl === 'on') {
      return true;
    }

    // Check Cloudflare-specific header
    const cfVisitor = req.headers['cf-visitor'];
    if (cfVisitor && typeof cfVisitor === 'string') {
      try {
        const parsed = JSON.parse(cfVisitor);
        if (parsed.scheme === 'https') {
          return true;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }

    return false;
  }
}
