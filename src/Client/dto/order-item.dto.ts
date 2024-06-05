import { IsNotEmpty, Min } from 'class-validator';

export class OrderItemDto {
  @Min(1)
  @IsNotEmpty()
  id: number;

  @Min(1)
  @IsNotEmpty()
  quantity: number;
}
