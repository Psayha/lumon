import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateLegalDocDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  version?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateLegalDocDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  version?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class DeleteLegalDocDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
