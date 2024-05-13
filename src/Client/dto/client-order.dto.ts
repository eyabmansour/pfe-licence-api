import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsDate,
} from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  itemIds: number[];

  @IsOptional()
  @IsString()
  deliveryAddress?: string | null;

  @IsOptional()
  @IsString()
  deliveryInstructions?: string | null;

  @IsOptional()
  @IsString()
  discountCode?: string | null;

  @IsOptional()
  @IsString()
  customerNotes?: string | null;

  @IsOptional()
  @IsString()
  deliveryMethod?: string | null;

  @IsOptional()
  @IsString()
  paymentMethod?: string | null;

  @IsOptional()
  @IsDate()
  estimatedDeliveryDate?: Date;
}
