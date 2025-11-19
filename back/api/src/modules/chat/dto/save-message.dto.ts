import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageRole } from '@entities';

// SECURITY FIX: Validate metadata structure
class MessageMetadata {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  language?: string;
}

export class SaveMessageDto {
  @IsString()
  @IsNotEmpty()
  chat_id!: string;

  @IsEnum(MessageRole)
  role!: MessageRole;

  // SECURITY FIX: Add max length to prevent DoS attacks
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000, { message: 'Message content too long (max 50000 characters)' })
  content!: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MessageMetadata)
  metadata?: MessageMetadata;
}
