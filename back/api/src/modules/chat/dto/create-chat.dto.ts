import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsOptional()
  @MaxLength(200) // SECURITY: Prevent DoS via huge titles
  title?: string;

  // NOTE: Frontend sends session_token in body for some reason
  // We ignore it since we get the token from Authorization header
  @IsString()
  @IsOptional()
  session_token?: string;
}
