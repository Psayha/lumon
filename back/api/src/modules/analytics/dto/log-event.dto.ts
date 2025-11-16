import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class LogEventDto {
  @IsString()
  @IsNotEmpty()
  event_name: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;
}
