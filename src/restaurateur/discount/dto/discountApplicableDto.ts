import { IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class DiscountApplicableToDto {
  @IsOptional()
  @IsNumber()
  minQuantity: number;

  @IsOptional()
  @IsNumber()
  minAmount: number;
}
