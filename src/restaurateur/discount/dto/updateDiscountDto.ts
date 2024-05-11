import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsOptional,
} from 'class-validator';

import { DiscountType } from '@prisma/client';

export class UpdateDiscountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  type?: DiscountType;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
