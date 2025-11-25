import { IsString, IsNotEmpty } from 'class-validator';

export class SendContactMessageDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  initData!: string;
}
