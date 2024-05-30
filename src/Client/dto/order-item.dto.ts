import { Min } from 'class-validator';

export class OrderItemDto {
  @Min(1)
  id: number;

  @Min(1)
  quantity: number;
}
