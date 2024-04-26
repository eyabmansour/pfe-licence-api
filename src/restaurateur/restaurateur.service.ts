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
  async register(restaurantDto: RegisterRestaurantDto): Promise<Restaurant> {
    try {
      const createRestaurant = await this.prisma.restaurant.create({
        data: {
          name: restaurantDto.restaurant.name,
          address: restaurantDto.restaurant.address,
          email: restaurantDto.restaurant.email,
          phoneNumber: restaurantDto.restaurant.phoneNumber,
          cuisineType: restaurantDto.restaurant.cuisineType,
          openingHours: restaurantDto.restaurant.openingHours,
          status: restaurantDto.restaurant.status,
        },
      });
      return createRestaurant;
    } catch (error) {
      throw new Error(
        `Erreur lors de la création du restaurant : ${error.message}`,
      );
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
