import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  Discount,
  DiscountType,
  DiscountApplicableTo,
  Restaurant,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { CreateDiscountDto } from './dto/CreateDiscountDto ';
import { UpdateDiscountDto } from './dto/UpdateDiscountDto';
import { DiscountApplicableToDto } from './dto/discountApplicableDto';
import { ClientService } from 'src/Client/client.service';
import { EventService } from 'src/Client/code/service/event.service';

@Injectable()
export class DiscountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: ClientService,
  ) {}
  async createDiscount(
    createDiscountDto: CreateDiscountDto,
    restaurantId: number,
  ): Promise<Discount> {
    const createDiscount = await this.prisma.discount.create({
      data: {
        ...createDiscountDto,
        restaurant: { connect: { id: restaurantId } },
      },
    });
    return createDiscount;
  }
  async updateDiscount(
    discountId: number,
    updateDiscountDto: UpdateDiscountDto,
  ): Promise<Discount> {
    const discount = await this.prisma.discount.findUnique({
      where: { id: discountId },
    });
    if (!discount) {
      throw new NotFoundException(`Discount with id ${discountId} not found`);
    }

    const updatedDiscount = await this.prisma.discount.update({
      where: { id: discountId },
      data: updateDiscountDto,
    });

    return updatedDiscount;
  }
  async DiscountApplicableTo(
    menuItemId: number,
    discountId: number,
    discountApplicableToDto: DiscountApplicableToDto,
  ): Promise<DiscountApplicableTo> {
    const discount = await this.prisma.discount.findUnique({
      where: { id: discountId },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with id ${discountId} not found`);
    }
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });
    if (!menuItem) {
      throw new NotFoundException(`MenuItem with id ${menuItemId} not found`);
    }

    const applicableTo = await this.prisma.discountApplicableTo.create({
      data: {
        ...discountApplicableToDto,
        discount: { connect: { id: discountId } },
        menuItem: { connect: { id: menuItemId } },
      },
    });

    return applicableTo;
  }

  async updateDiscountApplicableTo(
    discountApplicableToId: number,
    discountApplicableToDto: DiscountApplicableToDto,
  ): Promise<DiscountApplicableTo> {
    const discountApplicableTo =
      await this.prisma.discountApplicableTo.findUnique({
        where: { id: discountApplicableToId },
      });

    if (!discountApplicableTo) {
      throw new NotFoundException(
        `DiscountApplicableTo with id ${discountApplicableToId} not found`,
      );
    }

    const updatedDiscountApplicableTo =
      await this.prisma.discountApplicableTo.update({
        where: { id: discountApplicableToId },
        data: discountApplicableToDto,
      });

    return updatedDiscountApplicableTo;
  }
  async applyDiscountToMenuItems(
    discountId: number,
    restaurantId: number,
    discountApplicableToDto: DiscountApplicableToDto,
  ): Promise<void> {
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        restaurant_id: restaurantId,
      },
    });

    const discount = await this.prisma.discount.findUnique({
      where: { id: discountId },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with id ${discountId} not found`);
    }
    await Promise.all(
      menuItems.map(async (menuItem) => {
        await this.prisma.discountApplicableTo.create({
          data: {
            ...discountApplicableToDto,
            discount: { connect: { id: discountId } },
            menuItem: { connect: { id: menuItem.id } },
          },
        });
      }),
    );
  }
  async getDiscountsByOwner(ownerId: number): Promise<Discount[]> {
    return await this.prisma.discount.findMany({
      where: {
        restaurant: {
          ownerId: ownerId,
        },
      },
    });
  }
  async deleteDiscount(discountId: number): Promise<string> {
    const discount = await this.prisma.discount.findUnique({
      where: { id: discountId },
    });
    if (!discount) {
      throw new NotFoundException(`Discount with id ${discountId} not found`);
    }

    await this.prisma.discount.delete({
      where: { id: discountId },
    });
    return `Discount with id ${discountId} has been deleted successfully`;
  }
}
