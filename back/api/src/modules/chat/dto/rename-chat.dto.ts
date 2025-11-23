import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RenameChatDto {
  @IsString()
  @IsNotEmpty()
  chat_id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;
}
