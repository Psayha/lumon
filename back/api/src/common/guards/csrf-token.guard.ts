import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfTokenService } from '../services/csrf-token.service';

/**
 * Decorator to require CSRF token validation
 * Apply to controllers or specific routes
 *
 * Example:
 * @RequireCsrfToken()
 * @Post('user-delete')
 * async deleteUser() { ... }
 */
export const CSRF_TOKEN_KEY = 'require_csrf_token';
export const RequireCsrfToken = () =>
  Reflect.metadata(CSRF_TOKEN_KEY, true);

/**
 * SECURITY: CSRF Token Guard
 *
 * Validates CSRF tokens for endpoints decorated with @RequireCsrfToken()
 * Expects token in X-CSRF-Token header or csrf_token body field
 *
 * Provides additional protection for critical operations beyond Origin/Referer validation
 */
@Injectable()
export class CsrfTokenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private csrfTokenService: CsrfTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint requires CSRF token
    const requiresCsrfToken = this.reflector.getAllAndOverride<boolean>(
      CSRF_TOKEN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresCsrfToken) {
      return true; // Not required for this endpoint
    }

    const request = context.switchToHttp().getRequest();

    // Extract session ID from request
    // This assumes the auth guard has already run and attached session info
    const session = request.session || request.adminSession;
    if (!session) {
      throw new UnauthorizedException(
        'Authentication required for CSRF token validation',
      );
    }

    const sessionId = session.id || session.session_token;

    // Extract CSRF token from header or body
    const csrfToken =
      request.headers['x-csrf-token'] || request.body?.csrf_token;

    if (!csrfToken) {
      throw new ForbiddenException(
        'CSRF token required. Include X-CSRF-Token header or csrf_token in body.',
      );
    }

    // Validate token
    const validation = this.csrfTokenService.validateToken(csrfToken, sessionId);

    if (!validation.valid) {
      throw new ForbiddenException(
        `CSRF validation failed: ${validation.error}`,
      );
    }

    return true;
  }
}
