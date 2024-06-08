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
  async search(userId: number, queryDto: RestaurantQueryDto): Promise<any> {
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
  async getRestaurantById(restaurantId: number): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }
  async getMenuById(menuId: number): Promise<Menu> {
    return await this.prisma.menu.findUnique({
      where: { id: menuId },
      include: { menuItems: true },
    });
  }

  async createOrder(
    userId: number,
    restaurant_id: number,
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
      where: {
        id: { in: orderDetails.items.map((item) => item.id) },
        restaurant_id,
      },
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
          where: { menuItemId: item.id, discount: { isActive: true } },
          include: { discount: true },
        });
      const tempPrice = itemPrice;
      for (const applicableDiscount of applicableDiscounts) {
        if (applicableDiscount.discount.type === DiscountType.PERCENTAGE) {
          itemPrice -= tempPrice * (applicableDiscount.discount.value / 100);
        } else if (
          applicableDiscount.discount.type === DiscountType.FIXED_AMOUNT
        ) {
          itemPrice -= applicableDiscount.discount.value;
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
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot modify an order that is currently ${order.status.toLowerCase()}`,
      );
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const existingItem = order.items.find(
        (orderItem) => orderItem.menuItemId === item.id,
      );
      if (existingItem)
        await this.prisma.orderItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + item.quantity },
        });
      else
        await this.prisma.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: item.id,
            quantity: item.quantity,
          },
        });
    }

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } },
    });
    const totalPrice = await this.calculateTotalPrice(
      updatedOrder.items.map((item) => item.menuItem),
      updatedOrder.items.map((item) => ({
        id: item.menuItemId,
        quantity: item.quantity,
      })),
    );

    await this.prisma.order.update({
      where: { id: orderId },
      data: { totalPrice: totalPrice },
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
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot modify an order that is currently ${order.status.toLowerCase()}`,
      );
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const existingItem = order.items.find(
        (orderItem) => orderItem.menuItemId === item.id,
      );
      if (existingItem) {
        if (existingItem.quantity - item.quantity > 0)
          await this.prisma.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity - item.quantity },
          });
        else
          await this.prisma.orderItem.delete({
            where: { id: existingItem.id },
          });
      }
    }

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } },
    });

    const totalPrice = await this.calculateTotalPrice(
      updatedOrder.items.map((item) => item.menuItem),
      updatedOrder.items.map((item) => ({
        id: item.menuItemId,
        quantity: item.quantity,
      })),
    );

    await this.prisma.order.update({
      where: { id: orderId },
      data: { totalPrice: totalPrice },
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
