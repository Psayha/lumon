import { IsString, IsNotEmpty, IsOptional, IsObject, MaxLength } from 'class-validator';
import { ValidateJsonb } from '@/common/decorators/validate-jsonb.decorator';

export class LogEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100) // SECURITY: Prevent audit log pollution
  action!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100) // SECURITY: Prevent DoS
  resource?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100) // SECURITY: Prevent DoS (could be UUID or other ID)
  resource_id?: string;

  @IsObject()
  @IsOptional()
  @ValidateJsonb({
    maxDepth: 5, // Prevent deep nesting attacks
    maxSize: 50 * 1024, // 50KB max - prevent DoS
  })
  meta?: Record<string, any>; // SECURITY FIX: JSONB validation applied
}
