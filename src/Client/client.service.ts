import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Menu, MenuItem, Restaurant, RestaurantStatus } from '@prisma/client';
import { RestaurantQueryDto } from './dto/client.dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async search(queryDto: RestaurantQueryDto): Promise<any> {
    const { search, sortBy, sortOrder, menu, menuItem, cuisineType } = queryDto;
    let restaurants: Restaurant[] = [];

    // Vérifier s'il y a des critères de recherche de menu
    if (menu || menuItem) {
      // Si des critères de menu sont spécifiés, effectuez une recherche avec les menus et les éléments de menu
      restaurants = await this.prisma.restaurant.findMany({
        where: {
          status: RestaurantStatus.APPROVED,
          OR: [
            { name: { contains: search || '' } },
            { address: { contains: search || '' } },
          ],
        },
        orderBy: { [sortBy || 'name']: sortOrder || 'asc' },
        include: {
          menu: {
            include: {
              menuItems: true,
            },
          },
        },
      });
    } else {
      // Si aucun critère de menu n'est spécifié, renvoyez uniquement les restaurants
      restaurants = await this.prisma.restaurant.findMany({
        where: {
          status: RestaurantStatus.APPROVED,
          OR: [
            { name: { contains: search || '' } },
            { address: { contains: search || '' } },
          ],
        },
        orderBy: { [sortBy || 'name']: sortOrder || 'asc' },
      });
    }

    return restaurants;
  }
}
