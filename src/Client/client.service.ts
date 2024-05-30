import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  DiscountType,
  Menu,
  MenuItem,
  Order,
  OrderStatus,
  Restaurant,
  RestaurantStatus,
} from '@prisma/client';
import { RestaurantQueryDto } from './dto/client.dto';
import { CreateOrderDto } from './dto/client-order.dto';
import { EventService } from './code/service/event.service';
import { OrderItemDto } from './dto/order-item.dto';

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
      where: { id: { in: orderDetails.items.map((item) => item.id) } },
    });
    if (menuItems.length !== orderDetails.items.length) {
      throw new BadRequestException('One or more items not found in the menu');
    }

    const totalPrice = await this.calculateTotalPrice(
      menuItems,
      orderDetails.items,
    );

    const order = await this.prisma.order.create({
      data: {
        user: { connect: { id: userId } },
        items: {
          createMany: {
            data: orderDetails.items.map((item) => ({
              menuItemId: item.id,
              quantity: item.quantity,
            })),
          },
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
  async calculateTotalPrice(
    menuItems: MenuItem[],
    requestedItems: OrderItemDto[],
  ): Promise<number> {
    let totalPrice = 0;
    for (const item of requestedItems) {
      const quantity = item.quantity;
      let itemPrice = menuItems.find(
        (menuItem) => menuItem.id === item.id,
      ).price;

      const applicableDiscounts =
        await this.prisma.discountApplicableTo.findMany({
          where: { menuItemId: item.id },
          include: { discount: true },
        });

      for (const applicableDiscount of applicableDiscounts) {
        if (applicableDiscount.discount.isActive) {
          if (applicableDiscount.discount.type === DiscountType.PERCENTAGE) {
            itemPrice -= itemPrice * (applicableDiscount.discount.value / 100);
          } else if (
            applicableDiscount.discount.type === DiscountType.FIXED_AMOUNT
          ) {
            itemPrice -= applicableDiscount.discount.value;
          }
        }
      }
      totalPrice += itemPrice * quantity;
    }
    return totalPrice;
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
      include: { items: { include: { menuItem: true } } },
    });

    const { items, ...rest } = updatedOrderDetails;

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }
    if (existingOrder.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot modify an order that is currently ${existingOrder.status.toLowerCase()}`,
      );
    }
    const totalPrice = await this.calculateTotalPrice(
      existingOrder.items.map((item) => item.menuItem),
      existingOrder.items,
    );

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...rest,
        totalPrice,
      },
      include: { items: true },
    });

    return updatedOrder;
  }

  async addItemsToOrder(
    orderId: number,
    items: OrderItemDto[],
  ): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot modify an order that is currently ${order.status.toLowerCase()}`,
      );
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        items: {
          createMany: {
            data: items.map((item) => ({
              menuItemId: item.id,
              quantity: item.quantity,
            })),
          },
        },
      },
    });
    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } },
    });
    const totalPrice = await this.calculateTotalPrice(
      updatedOrder.items.map((item) => item.menuItem),
      updatedOrder.items,
    );

    await this.prisma.order.update({
      where: { id: orderId },
      data: { totalPrice: order.totalPrice + totalPrice },
    });

    const finalUpdatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    return finalUpdatedOrder;
  }

  async removeItemsFromOrder(
    orderId: number,
    items: OrderItemDto[],
  ): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot modify an order that is currently ${order.status.toLowerCase()}`,
      );
    }
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        items: {
          deleteMany: { menuItemId: { in: items.map((item) => item.id) } },
        },
      },
    });

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } },
    });

    const totalPrice = await this.calculateTotalPrice(
      updatedOrder.items.map((item) => item.menuItem),
      updatedOrder.items,
    );

    await this.prisma.order.update({
      where: { id: orderId },
      data: { totalPrice: order.totalPrice - totalPrice },
    });

    const finalUpdatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    return finalUpdatedOrder;
  }
  async updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus,
  ): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order Not Found');
    }
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: true },
    });
    return updatedOrder;
  }
  async countUserOrders(userId: number): Promise<number> {
    const orderCount = await this.prisma.order.count({
      where: { userId: userId },
    });
    return orderCount;
  }
}
