import { IsString, IsNotEmpty, IsOptional, IsObject, MaxLength } from 'class-validator';

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
  meta?: Record<string, any>; // TODO: Add size validation for metadata object
}
