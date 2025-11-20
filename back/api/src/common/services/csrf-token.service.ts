import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';

/**
 * SECURITY: CSRF Token Service
 *
 * Generates and validates CSRF tokens for critical operations
 * Uses HMAC-based tokens that don't require server-side storage
 *
 * Usage:
 * 1. Generate token when user logs in or loads a form
 * 2. Include token in request (header or body)
 * 3. Validate token before processing critical operation
 *
 * Token format: {timestamp}-{random}-{hmac}
 * - timestamp: prevents replay attacks via expiration
 * - random: prevents token prediction
 * - hmac: prevents token tampering
 */
@Injectable()
export class CsrfTokenService {
  private readonly SECRET_KEY: string;
  private readonly TOKEN_LIFETIME_MINUTES = 60; // 1 hour

  constructor() {
    // Use environment variable or generate a random key
    // In production, MUST set CSRF_SECRET_KEY in environment
    this.SECRET_KEY =
      process.env.CSRF_SECRET_KEY || this.generateDefaultSecret();

    if (!process.env.CSRF_SECRET_KEY && process.env.NODE_ENV === 'production') {
      console.warn(
        '⚠️  WARNING: CSRF_SECRET_KEY not set in production! ' +
          'Using auto-generated key (tokens will be invalidated on restart). ' +
          'Set CSRF_SECRET_KEY in environment variables.',
      );
    }
  }

  /**
   * Generate a CSRF token for a session
   * @param sessionId - User session ID to bind token to
   * @returns CSRF token string
   */
  generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const random = randomBytes(16).toString('hex');
    const payload = `${timestamp}-${random}-${sessionId}`;

    // Create HMAC signature
    const hmac = createHmac('sha256', this.SECRET_KEY)
      .update(payload)
      .digest('hex');

    // Token format: timestamp-random-hmac
    return `${timestamp}-${random}-${hmac}`;
  }

  /**
   * Validate a CSRF token
   * @param token - CSRF token to validate
   * @param sessionId - User session ID to verify against
   * @returns Object with valid status and error message
   */
  validateToken(
    token: string,
    sessionId: string,
  ): { valid: boolean; error?: string } {
    if (!token) {
      return { valid: false, error: 'Missing CSRF token' };
    }

    // Parse token
    const parts = token.split('-');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid CSRF token format' };
    }

    const [timestamp, random, hmac] = parts;

    // Check expiration
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    const maxAge = this.TOKEN_LIFETIME_MINUTES * 60 * 1000;

    if (isNaN(tokenTime) || now - tokenTime > maxAge) {
      return { valid: false, error: 'CSRF token expired' };
    }

    // Verify HMAC
    const payload = `${timestamp}-${random}-${sessionId}`;
    const expectedHmac = createHmac('sha256', this.SECRET_KEY)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison
    if (!this.timingSafeEqual(hmac, expectedHmac)) {
      return { valid: false, error: 'Invalid CSRF token signature' };
    }

    return { valid: true };
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Generate a default secret key (only for development)
   * In production, CSRF_SECRET_KEY environment variable MUST be set
   */
  private generateDefaultSecret(): string {
    return randomBytes(32).toString('hex');
  }
}
