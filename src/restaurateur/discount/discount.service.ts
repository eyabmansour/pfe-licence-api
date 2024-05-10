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
  CustomerType,
} from '@prisma/client';
import { CreateDiscountDto } from './dto/CreateDiscountDto ';
import { UpdateDiscountDto } from './dto/UpdateDiscountDto';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async createDiscount(
    createDiscountDto: CreateDiscountDto,
  ): Promise<Discount> {
    const { startDate, endDate, type, applicableTo } = createDiscountDto;

    // Vérifier si les dates de début et de fin sont valides
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('End date must be after start date');
    }
    switch (type) {
      case DiscountType.PERCENTAGE:
        // Logique spécifique pour la remise en pourcentage
        break;
      case DiscountType.FIXED_AMOUNT:
        // Logique spécifique pour le montant fixe de remise
        break;
      default:
        throw new BadRequestException('Invalid discount type');
    }
    // Vérifier si la condition d'application de la réduction est valide
    if (!this.isValidApplicableTo(applicableTo)) {
      throw new BadRequestException('Invalid applicableTo');
    }

    // Créer la réduction
    const discount = await this.prisma.discount.create({
      data: {
        ...createDiscountDto,
      },
    });

    // Associer la réduction aux éléments de menu spécifiés
    await this.updateDiscountApplicableTo(discount.id, applicableTo);

    return discount;
  }

  async updateDiscount(
    id: number,
    updateDiscountDto: UpdateDiscountDto,
  ): Promise<Discount> {
    const { startDate, endDate, type, applicableTo } = updateDiscountDto;

    // Vérifier si les dates de début et de fin sont valides
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('End date must be after start date');
    }
    switch (type) {
      case DiscountType.PERCENTAGE:
        break;
      case DiscountType.FIXED_AMOUNT:
        break;
      default:
        throw new BadRequestException('Invalid discount type');
    }
    // Vérifier si la condition d'application de la réduction est valide
    if (!this.isValidApplicableTo(applicableTo)) {
      throw new BadRequestException('Invalid applicableTo');
    }

    // Mettre à jour la réduction
    const discount = await this.findDiscountById(id);
    await this.prisma.discount.update({
      where: { id },
      data: { ...updateDiscountDto },
    });

    // Mettre à jour les éléments de menu auxquels la réduction s'applique
    await this.updateDiscountApplicableTo(id, applicableTo);

    return discount;
  }

  async deleteDiscount(id: number): Promise<void> {
    await this.findDiscountById(id);
    await this.prisma.discount.delete({ where: { id } });
  }

  async getAllDiscounts(): Promise<Discount[]> {
    return await this.prisma.discount.findMany();
  }

  async findDiscountById(id: number): Promise<Discount> {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) {
      throw new NotFoundException('Discount not found');
    }
    return discount;
  }

  async updateDiscountApplicableTo(
    discountId: number,
    applicableTo: DiscountApplicableTo[],
  ): Promise<void> {
    // Supprimer toutes les associations précédentes
    await this.prisma.discountApplicableTo.deleteMany({
      where: { discountId },
    });

    // Associer la réduction aux éléments de menu spécifiés
    await Promise.all(
      applicableTo.map(
        async ({ menuItemId, minQuantity, minAmount, customerType }) => {
          await this.prisma.discountApplicableTo.create({
            data: {
              discountId,
              menuItemId,
              minQuantity,
              minAmount,
              customerType,
            },
          });
        },
      ),
    );
  }

  private isValidApplicableTo(applicableTo: DiscountApplicableTo[]): boolean {
    return applicableTo.every(
      ({ menuItemId, minQuantity, minAmount, customerType }) =>
        menuItemId &&
        minQuantity >= 0 &&
        minAmount >= 0 &&
        Object.values(CustomerType).includes(customerType),
    );
  }
}
