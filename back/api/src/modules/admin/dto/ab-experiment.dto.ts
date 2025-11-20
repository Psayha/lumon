import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { IsUuidV4 } from '@/common/decorators/is-uuid-v4.decorator';

/**
 * DTO for creating A/B experiment
 */
export class CreateAbExperimentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  feature_name!: string;

  @IsBoolean()
  is_active!: boolean;
}

/**
 * DTO for updating A/B experiment
 */
export class UpdateAbExperimentDto {
  @IsUuidV4()
  @IsNotEmpty()
  experiment_id!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  feature_name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * DTO for getting A/B experiment stats
 */
export class GetAbExperimentStatsDto {
  @IsUuidV4()
  @IsNotEmpty()
  experiment_id!: string;
}
