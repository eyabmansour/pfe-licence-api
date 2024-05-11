import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Menu, Order, Restaurant, RestaurantStatus } from '@prisma/client';
import { RestaurantQueryDto } from './dto/client.dto';
import { CreateOrderDto } from './dto/client-order.dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}
  async search(queryDto: RestaurantQueryDto): Promise<any> {
    const {
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      menu,
      menuItem,
    } = queryDto;
    const restaurantQuery = {
      where: {
        status: RestaurantStatus.APPROVED,
        OR: [
          { name: { contains: search || '' } },
          { address: { contains: search || '' } },
          { cuisineType: { contains: search || '' } },
        ],
      },
      orderBy: { [sortBy]: sortOrder },
    };
    const restaurants = await this.prisma.restaurant.findMany({
      ...restaurantQuery,
    });

    if (menu) {
      const menus = await this.prisma.menu.findMany({
        ...restaurantQuery,
        where: {
          OR: [
            { name: { contains: search || '' } },
            { description: { contains: search || '' } },
          ],
        },
        include: {
          menuItems: true,
        },
      });
      return { menus };
    }

    if (menuItem) {
      const menuItems = await this.prisma.menuItem.findMany({
        ...restaurantQuery,
        where: {
          OR: [
            { name: { contains: search || '' } },
            { description: { contains: search || '' } },
          ],
        },
      });
      return { menuItems };
    }
    return { restaurants };
  }
  async getMenuById(menuId: number): Promise<Menu> {
    return await this.prisma.menu.findUnique({
      where: { id: menuId },
      include: { menuItems: true },
    });
  }
  async createOrder(
    userId: number,
    orderDetails: CreateOrderDto,
  ): Promise<Order> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: orderDetails.itemIds } },
    });
    if (menuItems.length !== orderDetails.itemIds.length) {
      throw new BadRequestException('One or more items not found in the menu');
    }

    const totalPrice = await this.calculateTotalPrice(menuItems);

    const order = await this.prisma.order.create({
      data: {
        user: { connect: { id: userId } },
        items: {
          connect: orderDetails.itemIds.map((itemId) => ({ id: itemId })),
        },
        totalPrice,
        deliveryAddress: orderDetails.deliveryAddress,
        deliveryInstructions: orderDetails.deliveryInstructions,
        discountCode: orderDetails.discountCode,
        customerNotes: orderDetails.customerNotes,
        deliveryMethod: orderDetails.deliveryMethod,
        paymentStatus: 'Pending',
        paymentMethod: orderDetails.paymentMethod,
        estimatedDeliveryDate: orderDetails.estimatedDeliveryDate,
      },
    });
    if (orderDetails.paymentMethod) {
      await this.updatePaymentStatus(order.id, 'Paid');
    }

    return order;
  }
  async updatePaymentStatus(orderId: number, status: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status },
    });
  }
  async calculateTotalPrice(menuItems: any[]): Promise<number> {
    return menuItems.reduce((total, item) => total + item.price, 0);
  }
}
