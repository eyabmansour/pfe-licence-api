import { Controller, Post, Body } from '@nestjs/common';
import { RestaurateurService } from './restaurateur.service';
import { Restaurant } from '@prisma/client';
import { RegisterRestaurantDto } from './dto/RegisterRestaurantDto';

@Controller('restaurateur')
export class RestaurateurController {
  constructor(private readonly restaurateurService: RestaurateurService) {}
  @Post('register')
  async register(
    @Body() restaurantData: RegisterRestaurantDto,
  ): Promise<Restaurant> {
    return this.restaurateurService.createRestaurantWithMenu(restaurantData);
  }
}
