import { IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { CustomerType } from '@prisma/client';
export class DiscountApplicableToDto {
  @IsOptional()
  @IsNumber()
  minQuantity: number;

  @IsOptional()
  @IsNumber()
  minAmount: number;

  @IsOptional()
  customerType: CustomerType;
}
