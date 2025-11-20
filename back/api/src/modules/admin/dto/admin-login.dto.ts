import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, Max, MaxLength, IsIn } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100) // SECURITY: Prevent DoS via huge usernames
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200) // SECURITY: Prevent DoS via huge passwords
  password!: string;
}

export class UpdateUserLimitsDto {
  @IsUUID(4) // SECURITY: Validate UUID format
  @IsNotEmpty()
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['messages', 'daily', 'monthly', 'api_calls']) // SECURITY: Only allow specific limit types
  limit_type!: string;

  @IsNumber() // SECURITY: Prevent NaN, Infinity, strings
  @Min(0) // SECURITY: Prevent negative limits
  @Max(1000000) // SECURITY: Prevent absurdly high limits
  limit_value!: number;
}
