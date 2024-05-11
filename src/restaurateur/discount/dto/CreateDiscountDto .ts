import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsOptional,
} from 'class-validator';

import { DiscountType } from '@prisma/client';

export class CreateDiscountDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  type: DiscountType;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
