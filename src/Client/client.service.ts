import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  Menu,
  MenuItem,
  Order,
  Restaurant,
  RestaurantStatus,
} from '@prisma/client';
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
      where: {
        id: userId,
      },
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

    return order;
  }

  async updatePaymentStatus(status: string, orderId: number): Promise<Order> {
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status },
      include: { items: true },
    });
    if (!updatedOrder) {
      throw new NotFoundException('Order not found');
    }
    return updatedOrder;
  }
  async calculateTotalPrice(menuItems: any[]): Promise<number> {
    return menuItems.reduce((total, item) => total + item.price, 0);
  }
  async getOrderDetails(orderId: number): Promise<Order> {
    return await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
  }
  async updateOrder(
    orderId: number,
    updatedOrderDetails: Partial<CreateOrderDto>,
  ): Promise<Order> {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    const totalPrice = await this.calculateTotalPrice(existingOrder.items);

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...updatedOrderDetails,
        totalPrice,
      },
      include: { items: true },
    });

    return updatedOrder;
  }

  async addItemsToOrder(orderId: number, itemIds: number[]): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        items: {
          connect: itemIds.map((itemId) => ({ id: itemId })),
        },
      },
    });
    const totalPrice = await this.calculateTotalPrice(order.items);

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { totalPrice },
      include: { items: true },
    });

    return updatedOrder;
  }

  async removeItemsFromOrder(
    orderId: number,
    itemIds: number[],
  ): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        items: {
          disconnect: itemIds.map((itemId) => ({ id: itemId })),
        },
      },
    });

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    const totalPrice = await this.calculateTotalPrice(updatedOrder.items);

    await this.prisma.order.update({
      where: { id: orderId },
      data: { totalPrice },
    });

    const finalUpdatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    return finalUpdatedOrder;
  }
}
