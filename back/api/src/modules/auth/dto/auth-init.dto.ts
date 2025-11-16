import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AuthInitDto {
  @IsString()
  @IsNotEmpty()
  initData: string;

  @IsString()
  @IsOptional()
  appVersion?: string;
}

export class AuthInitResponse {
  success: boolean;
  data?: {
    session_token: string;
    user: {
      id: string;
    };
    role: string;
    companyId: string | null;
    expires_at: Date;
  };
  error?: string;
  message?: string;
}
