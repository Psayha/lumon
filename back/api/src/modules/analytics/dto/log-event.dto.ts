import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class LogEventDto {
  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsString()
  @IsOptional()
  resource_id?: string;

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
