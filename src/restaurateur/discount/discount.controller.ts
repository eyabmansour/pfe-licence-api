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

import { Discount } from '@prisma/client';
import { CreateDiscountDto } from './dto/CreateDiscountDto ';
import { UpdateDiscountDto } from './dto/updateDiscountDto';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  async createDiscount(
    @Body() createDiscountDto: CreateDiscountDto,
  ): Promise<Discount> {
    return await this.discountService.createDiscount(createDiscountDto);
  }

  @Get()
  async getAllDiscounts(): Promise<Discount[]> {
    return await this.discountService.getAllDiscounts();
  }

  @Get(':id')
  async getDiscountById(@Param('id') id: string): Promise<Discount> {
    return await this.discountService.findDiscountById(+id);
  }

  @Put(':id')
  async updateDiscount(
    @Param('id') id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ): Promise<Discount> {
    return await this.discountService.updateDiscount(+id, updateDiscountDto);
  }

  @Delete(':id')
  async deleteDiscount(@Param('id') id: string): Promise<void> {
    await this.discountService.deleteDiscount(+id);
  }
}
