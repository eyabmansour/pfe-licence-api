import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { DiscountService } from './discount.service';

import { Discount, DiscountApplicableTo, Prisma } from '@prisma/client';
import { CreateDiscountDto } from './dto/CreateDiscountDto ';
import { DiscountApplicableToDto } from './dto/discountApplicableDto';
import { UpdateDiscountDto } from './dto/UpdateDiscountDto';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  async createDiscount(
    @Body() createDiscountDto: CreateDiscountDto,
  ): Promise<Discount> {
    return await this.discountService.createDiscount(createDiscountDto);
  }
  @Put(':id')
  async updateDiscount(
    @Param('id') id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ): Promise<Discount> {
    return await this.discountService.updateDiscount(+id, updateDiscountDto);
  }
  @Post('/applicable/:discountId/:menuItemId')
  async discountApplicableTo(
    @Param('discountId') discountId: string,
    @Param('menuItemId') menuItemId: string,
    @Body() ApplicableTo: DiscountApplicableToDto,
  ): Promise<DiscountApplicableTo> {
    return await this.discountService.DiscountApplicableTo(
      +menuItemId,
      +discountId,
      ApplicableTo,
    );
  }
  @Put('applicable/:id')
  async updateDiscountApplicableTo(
    @Param('id') id: string,
    @Body() applicableTo: DiscountApplicableToDto,
  ): Promise<DiscountApplicableTo> {
    return await this.discountService.updateDiscountApplicableTo(
      +id,
      applicableTo,
    );
  }
  @Post('/applicableToAll/:discountId/:restaurantId')
  async applyDiscountToMenuItems(
    @Param('discountId') discountId: string,
    @Param('restaurantId') restaurantId: string,
    @Body() applicableToAll: DiscountApplicableToDto,
  ): Promise<void> {
    return await this.discountService.applyDiscountToMenuItems(
      +discountId,
      +restaurantId,
      applicableToAll,
    );
  }
  @Delete(':discountId')
  async deleteDiscount(@Param() discountId: string): Promise<void> {
    return await this.discountService.deleteDiscount(+discountId);
  }
  @Post('/applyToOrder/:orderId')
  async applyDiscountsToOrder(
    @Param('orderId') orderId: string,
  ): Promise<void> {
    return await this.discountService.applyDiscountsToOrder(+orderId);
  }
}
