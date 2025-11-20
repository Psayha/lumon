import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard - validates user has required role for the endpoint
 *
 * Works with @Roles() decorator to implement role-based access control.
 * Must be used AFTER AuthGuard to ensure request.user is populated.
 *
 * Usage in controller:
 * @UseGuards(AuthGuard, RolesGuard)
 * @Roles('owner', 'manager')
 * async someEndpoint() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has any of the required roles
    return requiredRoles.includes(user?.role);
  }
}
