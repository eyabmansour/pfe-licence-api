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

import { Discount, DiscountApplicableTo, Prisma, User } from '@prisma/client';
import { CreateDiscountDto } from './dto/CreateDiscountDto ';
import { DiscountApplicableToDto } from './dto/discountApplicableDto';
import { UpdateDiscountDto } from './dto/UpdateDiscountDto';
import { UserRole } from 'src/roles/user-role.model';
import { ReqUser } from 'src/authentification/decorators/req-user.decorator';
import { MinRole } from 'src/roles/min-role.decorator';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post('/:restaurantId')
  async createDiscount(
    @Param('restaurantId') restaurantId: string,
    @Body() createDiscountDto: CreateDiscountDto,
  ): Promise<Discount> {
    return await this.discountService.createDiscount(
      createDiscountDto,
      +restaurantId,
    );
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
  @Get('dis')
  @MinRole(UserRole.RESTAURATEUR)
  async getDiscounts(@ReqUser() user: User): Promise<Discount[]> {
    return this.discountService.getDiscountsByOwner(user.id);
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
  @Delete('/:discountId')
  async deleteDiscount(
    @Param('discountId') discountId: string,
  ): Promise<string> {
    return await this.discountService.deleteDiscount(+discountId);
  }
}
