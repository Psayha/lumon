import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { MessageRole } from '@entities';

export class SaveMessageDto {
  @IsString()
  @IsNotEmpty()
  chat_id: string;

  @IsEnum(MessageRole)
  role: MessageRole;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
