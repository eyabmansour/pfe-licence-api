import {
  IsOptional,
  IsString,
  IsDate,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { OrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ValidateNested()
  @ArrayMinSize(1)
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

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
