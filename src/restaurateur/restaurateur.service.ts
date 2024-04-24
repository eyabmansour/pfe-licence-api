import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { RegisterRestaurantDto } from './dto/RegisterRestaurantDto';
import { Menu, MenuItem, Restaurant } from '@prisma/client';

@Injectable()
export class RestaurateurService {
  constructor(private readonly prisma: PrismaService) {}
  async createRestaurantWithMenu(
    data: RegisterRestaurantDto,
  ): Promise<Restaurant> {
    const { restaurant, menu, menuItems } = data;
    try {
      const createdRestaurant = await this.prisma.restaurant.create({
        data: {
          ...restaurant,
          menu: {
            create: [
              {
                ...menu,
                menuItems: {
                  create: menuItems.map((item) => ({ ...item })),
                },
              },
            ],
          },
        },
        include: {
          menu: {
            include: {
              menuItems: true,
            },
          },
        },
      });

      return createdRestaurant;
    } catch (error) {
      console.error('Error creating restaurant with menu:', error);
      throw new Error('Failed to create restaurant with menu items');
    }
  }
}
