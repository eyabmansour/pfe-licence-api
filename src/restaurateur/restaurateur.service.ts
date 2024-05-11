import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { RegisterRestaurantDto } from './dto/RegisterRestaurantDto';
import {
  Menu,
  MenuItem,
  Prisma,
  Restaurant,
  RestaurantRequest,
  RestaurantStatus,
} from '@prisma/client';
import { validate } from 'class-validator';
import { MenuDto } from './dto/MenuDto';
import { MenuItemDto } from './dto/MenuItemDto';
import { entityType } from './restaurateur.entity';
import { SubmitRestaurantRequestDto } from './dto/SubmitRestaurantRequestDto';

@Injectable()
export class RestaurateurService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    restaurantDto: RegisterRestaurantDto,
    ownerId: number,
  ): Promise<Restaurant> {
    const errors = await validate(restaurantDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const createRestaurant = await this.prisma.restaurant.create({
      data: {
        ...restaurantDto,
        status: RestaurantStatus.DRAFT,
        owner: { connect: { id: ownerId } },
      },
    });
    return createRestaurant;
  }
  async getEntities(
    entityType: 'restaurant' | 'menu' | 'menuItem',
  ): Promise<any[]> {
    let entities;

    switch (entityType) {
      case 'restaurant':
        entities = await this.prisma.restaurant.findMany();
        break;
      case 'menu':
        entities = await this.prisma.menu.findMany();
        break;
      case 'menuItem':
        entities = await this.prisma.menuItem.findMany();
        break;
      default:
        throw new NotFoundException("Type d'entité non valide");
    }

    if (!entities || entities.length === 0) {
      throw new NotFoundException(
        `Aucun ${entityType === 'menuItem' ? 'élément de menu' : entityType} trouvé.`,
      );
    }

    return entities;
  }

  async getRestaurantsByUserId(userId: number): Promise<any> {
    const userRestaurants = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });
    return userRestaurants?.restaurants;
  }

  async submitRestaurantRequest(
    restaurantId: number,
  ): Promise<RestaurantRequest> {
    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!existingRestaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const request = await this.prisma.restaurantRequest.create({
      data: {
        restaurant: {
          connect: { id: restaurantId },
        },
        status: RestaurantStatus.PENDING,
      },
    });
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { status: RestaurantStatus.PENDING },
    });
    return request;
  }

  async getPendingRestaurantRequests(): Promise<RestaurantRequest[]> {
    const requests = await this.prisma.restaurantRequest.findMany({
      where: { status: RestaurantStatus.PENDING },
      include: { restaurant: true },
    });
    return requests;
  }
  async updateRestaurantStatus(
    restaurantRequestId: number,
    newStatus: RestaurantStatus,
  ): Promise<RestaurantRequest> {
    const updatedRequest = await this.prisma.restaurantRequest.update({
      where: { id: restaurantRequestId },
      data: { status: newStatus },
      include: { restaurant: true },
    });
    const restaurantId = updatedRequest.restaurant.id;

    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { status: newStatus },
    });
    return updatedRequest;
  }
  async switchRestaurant(
    ownerId: number,
    restaurantId: number,
  ): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: ownerId,
      },
    });
    if (!restaurant) {
      throw new NotFoundException();
    }
    return restaurant;
  }
  async createMenu(restaurantId: number, menuDto: MenuDto): Promise<Menu> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (restaurant.status !== RestaurantStatus.APPROVED) {
      throw new BadRequestException('Restaurant must be approved by admin');
    }
    const menu = await this.prisma.menu.create({
      data: {
        name: menuDto.name,
        description: menuDto.description,
        restaurant: { connect: { id: restaurantId } },
      },
    });
    return menu;
  }
  async addMenuItemToMenu(
    MenuId: number,
    menuItemDto: MenuItemDto,
  ): Promise<any> {
    const menu = await this.prisma.menu.findUnique({
      where: { id: MenuId },
      include: { restaurant: true },
    });
    if (!menu) {
      throw new NotFoundException('Menu Not Found');
    }
    const menuItem = await this.prisma.menuItem.create({
      data: {
        name: menuItemDto.name,
        description: menuItemDto.description,
        price: menuItemDto.price,
        menu: { connect: { id: MenuId } },
        restaurant: { connect: { id: menu.restaurant.id } },
      },
    });
    return menuItem;
  }

  async uploadImage(
    entityType: 'Restaurant' | 'Menu' | 'MenuItem',
    entityId: number,
    imageUrl: string,
  ): Promise<void> {
    switch (entityType) {
      case 'Restaurant':
        await this.prisma.restaurant.update({
          where: { id: entityId },
          data: { imageUrl: imageUrl },
        });
        break;
      case 'Menu':
        await this.prisma.menu.update({
          where: { id: entityId },
          data: { imageUrl: imageUrl },
        });
        break;
      case 'MenuItem':
        await this.prisma.menuItem.update({
          where: { id: entityId },
          data: { imageUrl: imageUrl },
        });
        break;
      default:
        throw new Error('Invalid entity type');
    }
  }
  async deleteImage(
    entityType: 'Restaurant' | 'Menu' | 'MenuItem',
    entityId: number,
  ): Promise<void> {
    switch (entityType) {
      case 'Restaurant':
        await this.prisma.restaurant.update({
          where: { id: entityId },
          data: { imageUrl: null },
        });
        break;
      case 'Menu':
        await this.prisma.menu.update({
          where: { id: entityId },
          data: { imageUrl: null },
        });
        break;
      case 'MenuItem':
        await this.prisma.menuItem.update({
          where: { id: entityId },
          data: { imageUrl: null },
        });
        break;
      default:
        throw new Error('Invalid entity type');
    }
  }
}
