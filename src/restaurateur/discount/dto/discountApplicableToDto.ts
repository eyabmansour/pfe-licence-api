import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { CustomerType } from '@prisma/client';

export class DiscountApplicableToDto {
  @IsNotEmpty()
  @IsNumber()
  discountId: number;

  @IsNotEmpty()
  @IsNumber()
  menuItemId: number;

  @IsOptional()
  @IsNumber()
  minQuantity: number;

  @IsOptional()
  @IsNumber()
  minAmount: number;

  @IsOptional()
  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate: Date;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType: CustomerType;
}
