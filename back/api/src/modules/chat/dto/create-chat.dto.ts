import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsOptional()
  @MaxLength(200) // SECURITY: Prevent DoS via huge titles
  title?: string;
}
