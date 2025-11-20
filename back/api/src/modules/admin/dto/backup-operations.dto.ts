import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { IsUuidV4 } from '@/common/decorators/is-uuid-v4.decorator';
import { IsSafeFilePath } from '@/common/decorators/is-safe-file-path.decorator';

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
  @IsSafeFilePath({
    allowedExtensions: ['.sql'],
    allowAbsolutePaths: true, // Allow absolute paths for backup directory
    message: 'Invalid backup file path - must be a .sql file without path traversal sequences',
  })
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
