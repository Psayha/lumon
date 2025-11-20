import { IsNotEmpty } from 'class-validator';
import { IsUuidV4 } from '@/common/decorators/is-uuid-v4.decorator';

/**
 * SECURITY: DTOs for user operations
 * Ensures UUID validation for all user-related operations
 */

/**
 * DTO for deleting user
 */
export class DeleteUserDto {
  @IsUuidV4()
  @IsNotEmpty()
  user_id!: string;
}

/**
 * DTO for banning user
 */
export class BanUserDto {
  @IsUuidV4()
  @IsNotEmpty()
  user_id!: string;

  @IsUuidV4()
  @IsNotEmpty()
  company_id!: string;
}

/**
 * DTO for clearing user history
 */
export class ClearUserHistoryDto {
  @IsUuidV4()
  @IsNotEmpty()
  user_id!: string;
}

/**
 * DTO for resetting user limits
 */
export class ResetUserLimitsDto {
  @IsUuidV4()
  @IsNotEmpty()
  user_id!: string;
}
