import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { Menu, MenuItem, Order, Restaurant } from '@prisma/client';
import { RestaurantQueryDto } from './dto/client.dto';
import { AuthGuard } from 'src/authentification/auth.guard';
import { CreateOrderDto } from './dto/client-order.dto';

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

  @Post('order/:userId')
  async createOrder(
    @Param('userId') userId: string,
    @Body() orderDetails: CreateOrderDto,
  ): Promise<Order> {
    return await this.clientService.createOrder(+userId, orderDetails);
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
    @Body() itemIds: number[],
  ) {
    return this.clientService.addItemsToOrder(+orderId, itemIds);
  }

  @Put('order/:orderId/remove')
  async removeItemsFromOrder(
    @Param('orderId') orderId: string,
    @Body() itemIds: number[],
  ) {
    return this.clientService.removeItemsFromOrder(+orderId, itemIds);
  }
}
