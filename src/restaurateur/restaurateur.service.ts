import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { RegisterRestaurantDto } from './dto/RegisterRestaurantDto';
import {
  Restaurant,
  RestaurantRequest,
  RestaurantStatus,
} from '@prisma/client';

@Injectable()
export class RestaurateurService {
  constructor(private readonly prisma: PrismaService) {}
  async register(data: RegisterRestaurantDto): Promise<Restaurant> {
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
  async submitRestaurantRequest(
    restaurantId: number,
  ): Promise<RestaurantRequest> {
    try {
      const request = await this.prisma.restaurantRequest.create({
        data: {
          restaurant: { connect: { id: restaurantId } },
          status: RestaurantStatus.PENDING,
        },
      });
      return request;
    } catch (error) {
      console.error('Error submitting restaurant request:', error);
      throw new Error('Failed to submit restaurant request');
    }
  }
  async getPendingRestaurantRequests(): Promise<RestaurantRequest[]> {
    try {
      const requests = await this.prisma.restaurantRequest.findMany({
        where: { status: RestaurantStatus.PENDING },
        include: { restaurant: true },
      });
      return requests;
    } catch (error) {
      console.error('Error getting pending restaurant requests:', error);
      throw new Error('Failed to get pending restaurant requests');
    }
  }
  async updateRestaurantStatus(
    restaurantRequestId: number,
    newStatus: RestaurantStatus,
  ): Promise<RestaurantRequest> {
    try {
      const updatedRequest = await this.prisma.restaurantRequest.update({
        where: { id: restaurantRequestId },
        data: { status: newStatus },
        include: { restaurant: true },
      });
      return updatedRequest;
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      throw new Error('Failed to update restaurant status');
    }
  }
}
