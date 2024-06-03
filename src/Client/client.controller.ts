import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ClientService } from './client.service';
import {
  Menu,
  MenuItem,
  Order,
  OrderStatus,
  Restaurant,
  User,
} from '@prisma/client';
import { RestaurantQueryDto } from './dto/client.dto';
import { AuthGuard } from 'src/authentification/auth.guard';
import { CreateOrderDto } from './dto/client-order.dto';
import { OrderItemDto } from './dto/order-item.dto';
import { ReqUser } from 'src/authentification/decorators/req-user.decorator';

@Controller('clients')
@UseGuards(AuthGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('search')
  async search(@Query() queryDto: RestaurantQueryDto): Promise<{
    restaurants: Restaurant[];
    menus: Menu[];
    menuItems: MenuItem[];
  }> {
    return this.clientService.search(queryDto);
  }

  @Get(':id')
  async getMenuById(@Param('id') menuId: string): Promise<Menu> {
    return await this.clientService.getMenuById(+menuId);
  }

  @Post('order/:restaurantId')
  async createOrder(
    @Param('restaurantId') restaurantId: string,
    @Body() orderDetails: CreateOrderDto,
    @ReqUser() user: User,
  ): Promise<Order> {
    return await this.clientService.createOrder(
      user.id,
      +restaurantId,
      orderDetails,
    );
  }
  @Get('order/:orderId')
  async getOrderDetails(@Param('orderId') orderId: string): Promise<Order> {
    return await this.clientService.getOrderDetails(+orderId);
  }
  @Post('/status/:orderId')
  async updatePaymentStatus(
    @Param() orderId: string,
    @Body() status: string,
  ): Promise<Order> {
    return await this.clientService.updatePaymentStatus(status, +orderId);
  }
  @Put('/order/:id')
  async updateOrder(
    @Param('id') orderId: string,
    @Body() updatedOrderDetails: Partial<CreateOrderDto>,
  ): Promise<Order> {
    return this.clientService.updateOrder(+orderId, updatedOrderDetails);
  }
  @Post('order/:orderId/add')
  async addItemsToOrder(
    @Param('orderId') orderId: string,
    @Body() itemIds: OrderItemDto[],
  ) {
    return this.clientService.addItemsToOrder(+orderId, itemIds);
  }

  @Put('order/:orderId/remove')
  async removeItemsFromOrder(
    @Param('orderId') orderId: string,
    @Body() itemIds: OrderItemDto[],
  ) {
    return this.clientService.removeItemsFromOrder(+orderId, itemIds);
  }
  @Patch('order/:id/status/:status')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Param('status') status: OrderStatus,
  ): Promise<Order> {
    return this.clientService.updateOrderStatus(+orderId, status);
  }
  @Get('count/:userId')
  async countUserOrders(@Param('userId') userId: string): Promise<number> {
    return this.clientService.countUserOrders(Number(userId));
  }
}
