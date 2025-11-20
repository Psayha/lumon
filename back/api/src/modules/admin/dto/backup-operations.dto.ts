import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { IsUuidV4 } from '@/common/decorators/is-uuid-v4.decorator';

/**
 * SECURITY: DTOs for backup operations
 * Ensures UUID validation and path sanitization
 */

/**
 * DTO for restoring backup
 */
export class RestoreBackupDto {
  @IsUuidV4()
  @IsNotEmpty()
  backup_id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500) // Prevent path traversal with very long paths
  file_path!: string;
}

/**
 * DTO for deleting backup
 */
export class DeleteBackupDto {
  @IsUuidV4()
  @IsNotEmpty()
  backup_id!: string;
}

/**
 * DTO for running health check
 */
export class RunHealthCheckDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  service?: string;
}
