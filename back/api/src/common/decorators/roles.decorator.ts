import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Roles decorator for role-based access control
 *
 * Usage:
 * @Roles('owner')  - Only owners can access
 * @Roles('owner', 'manager')  - Owners and managers can access
 * @Roles('viewer', 'manager', 'owner')  - All roles can access
 *
 * Example:
 * @Get('admin-only')
 * @UseGuards(AuthGuard, RolesGuard)
 * @Roles('owner')
 * async adminOnlyEndpoint() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
