import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType, DiscountApplicableTo } from '@prisma/client';
import { DiscountApplicableToDto } from './discountApplicableToDto';

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

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  applicableTo?: DiscountApplicableTo[];
}
