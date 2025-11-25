import { IsString, IsNotEmpty } from 'class-validator';

export class BindUserToCompanyDto {
  @IsString()
  @IsNotEmpty()
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  company_id!: string;

  @IsString()
  @IsNotEmpty()
  role!: string; // 'owner', 'manager', 'viewer'
}

export class UnbindUserFromCompanyDto {
  @IsString()
  @IsNotEmpty()
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  company_id!: string;
}
