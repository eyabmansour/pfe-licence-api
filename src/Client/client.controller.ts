import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { Menu, MenuItem, Restaurant } from '@prisma/client';
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
    @Param() userId: string,
    @Body() orderDetails: CreateOrderDto,
  ): Promise<any> {
    return await this.clientService.createOrder(+userId, orderDetails);
  }
}
