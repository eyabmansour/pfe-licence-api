import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
  @Get('orders/:orderId')
  async getOrderDetails(@Param('orderId') orderId: string): Promise<Order> {
    return await this.clientService.getOrderDetails(+orderId);
  }
  @Post('orders/:orderId/items/add')
  async addItemsToOrder(
    @Param('orderId') orderId: string,
    @Body() itemIds: number[],
  ): Promise<void> {
    await this.clientService.addItemsToOrder(+orderId, itemIds);
  }

  @Post('orders/:orderId/items/remove')
  async removeItemsFromOrder(
    @Param('orderId') orderId: string,
    @Body() itemIds: number[],
  ): Promise<void> {
    await this.clientService.removeItemsFromOrder(+orderId, itemIds);
  }

  @Patch('orders/:orderId/items/:itemId')
  async updateItemInOrder(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updatedItem: Partial<MenuItem>,
  ): Promise<void> {
    await this.clientService.updateItemInOrder(+orderId, +itemId, updatedItem);
  }
}
