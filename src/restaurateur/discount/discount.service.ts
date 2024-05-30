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
  async deleteDiscount(discountId: number): Promise<void> {
    const discount = await this.prisma.discount.findUnique({
      where: { id: discountId },
    });
    if (!discount) {
      throw new NotFoundException(`Discount with id ${discountId} not found`);
    }

    await this.prisma.discount.delete({
      where: { id: discountId },
    });
  }
  async applyDiscountForReferralCode(
    referralCode: string,
    discountId: number,
  ): Promise<void> {
    const userWithReferralCode = await this.prisma.user.findFirst({
      where: { referralCode },
    });

    if (!userWithReferralCode) {
      throw new NotFoundException(
        `User with referral code ${referralCode} not found`,
      );
    }

    const discount = await this.prisma.discount.findUnique({
      where: { id: discountId },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with id ${discountId} not found`);
    }

    // Appliquer la réduction à l'utilisateur avec le code de parrainage
    await this.prisma.discountApplicableTo.create({
      data: {
        discount: { connect: { id: discountId } },
        user: { connect: { id: userWithReferralCode.id } },
      },
    });
  }
}
