import { Controller, Post, Body, Get, Patch, Param } from '@nestjs/common';
import { RestaurateurService } from './restaurateur.service';
import {
  Restaurant,
  RestaurantRequest,
  RestaurantStatus,
} from '@prisma/client';
import { RegisterRestaurantDto } from './dto/RegisterRestaurantDto';
import { SubmitRestaurantRequestDto } from './dto/SubmitRestaurantRequestDto';
import { MinRole } from 'src/roles/min-role.decorator';
import { UserRole } from 'src/roles/user-role.model';

@Controller('restaurateur')
export class RestaurateurController {
  constructor(private readonly restaurateurService: RestaurateurService) {}
  @Post('/register')
  async register(
    @Body() restaurantData: RegisterRestaurantDto,
  ): Promise<Restaurant> {
    return this.restaurateurService.register(restaurantData);
  }
  @Post('/request')
  @MinRole(UserRole.RESTAURATEUR)
  async submitRequest(
    @Body() requestData: SubmitRestaurantRequestDto,
  ): Promise<RestaurantRequest> {
    const { restaurantId } = requestData;
    return this.restaurateurService.submitRestaurantRequest(restaurantId);
  }
  @Get('/request/pending')
  @MinRole(UserRole.ADMINISTRATOR)
  async getPendingRequests(): Promise<RestaurantRequest[]> {
    return this.restaurateurService.getPendingRestaurantRequests();
  }
  @Patch('/request/:id/status/:status')
  @MinRole(UserRole.ADMINISTRATOR)
  async updateStatus(
    @Param('id') requestId: number,
    @Param('status') status: RestaurantStatus,
  ): Promise<RestaurantRequest> {
    return this.restaurateurService.updateRestaurantStatus(requestId, status);
  }
}
