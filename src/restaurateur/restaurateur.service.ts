import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { RegisterRestaurantDto } from './dto/RegisterRestaurantDto';
import {
  Category,
  Menu,
  MenuItem,
  Prisma,
  Restaurant,
  RestaurantRequest,
  RestaurantStatus,
  RoleCodeEnum,
  User,
} from '@prisma/client';
import { validate } from 'class-validator';
import { MenuDto } from './dto/MenuDto';
import { MenuItemDto } from './dto/MenuItemDto';
import { entityType } from './restaurateur.entity';
import { SubmitRestaurantRequestDto } from './dto/SubmitRestaurantRequestDto';
import { CategoryDto } from './dto/CategorieDto';
import { UpdateDiscountDto } from './discount/dto/UpdateDiscountDto';
import { UpdateRestaurantDto } from './dto/UpdateRestaurantDto';

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
        status: RestaurantStatus.PENDING,
        owner: { connect: { id: ownerId } },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      include: { role: true },
    });
    if (user.role.code !== RoleCodeEnum.ADMINISTRATOR)
      await this.prisma.user.update({
        where: { id: ownerId },
        data: { role: { connect: { code: RoleCodeEnum.RESTAURATEUR } } },
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
  async getUserRestaurants(userId: number): Promise<Restaurant[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('User Not Found!');
    }
    const app = { status: RestaurantStatus.APPROVED };
    if (user.role.code === RoleCodeEnum.ADMINISTRATOR) {
      return this.prisma.restaurant.findMany({
        where: app,
      });
    } else if (user.role.code === RoleCodeEnum.RESTAURATEUR) {
      return this.prisma.restaurant.findMany({
        where: {
          ...app,
          ownerId: userId,
        },
      });
    } else {
      throw new BadRequestException(
        'User does not have permission to access restaurants ',
      );
    }
  }
  async updateRestaurant(
    restaurantId: number,
    ownerId: number,
    updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    // Vérifiez si le restaurant existe et si l'utilisateur est le propriétaire
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to update this restaurant',
      );
    }

    // Effectuer la mise à jour du restaurant avec les nouveaux détails
    const updatedRestaurant = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { ...updateRestaurantDto },
    });
    return updatedRestaurant;
  }

  async deleteRestaurant(
    restaurant_Id: number,
    ownerId: number,
  ): Promise<void> {
    // Vérifier si le restaurant existe et si l'utilisateur est le propriétaire
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurant_Id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to delete this restaurant',
      );
    }
    // Supprimer le restaurant
    await this.prisma.restaurant.delete({
      where: { id: restaurant_Id },
    });
  }

  async getRestaurantMenus(
    restaurantId: number,
    ownerId: number,
  ): Promise<Menu[]> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { menu: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new UnauthorizedException(
        "You do not have permission to access this restaurant's menus",
      );
    }

    return restaurant.menu;
  }
  /*
  async getRestaurantsByUserId(userId: number): Promise<any> {
    const userRestaurants = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });
    return userRestaurants?.restaurants;
  }
*/
  async submitRestaurantRequest(
    restaurantId: number,
    ownerId: number,
  ): Promise<RestaurantRequest> {
    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!existingRestaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (existingRestaurant.ownerId !== ownerId) {
      throw new UnauthorizedException(
        "You do not have permission to access this restaurant's menus",
      );
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
    userId: number,
  ): Promise<RestaurantRequest> {
    const currentRequest = await this.prisma.restaurantRequest.findUnique({
      where: { id: restaurantRequestId },
      include: { restaurant: true },
    });
    if (!currentRequest) {
      throw new Error("La demande de restaurant n'existe pas");
    }
    const currentStatus = currentRequest.status;
    if (newStatus === RestaurantStatus.APPROVED) {
      if (
        currentStatus === RestaurantStatus.PENDING ||
        currentStatus === RestaurantStatus.REJECTED
      ) {
        await this.prisma.restaurantRequest.update({
          where: { id: restaurantRequestId },
          data: { status: newStatus },
        });
        await this.prisma.restaurant.update({
          where: { id: currentRequest.restaurant_id },
          data: { status: newStatus },
        });
      } else if (currentStatus === RestaurantStatus.BLOCKED) {
        throw new Error("impossible d'accepter une demande déjà bloquée");
      }
    } else if (newStatus === RestaurantStatus.REJECTED) {
      if (currentStatus === RestaurantStatus.PENDING) {
        await this.prisma.restaurantRequest.update({
          where: { id: restaurantRequestId },
          data: { status: newStatus },
        });
        await this.prisma.restaurant.update({
          where: { id: currentRequest.restaurant_id },
          data: { status: newStatus },
        });
      } else if (
        currentStatus === RestaurantStatus.BLOCKED ||
        currentStatus === RestaurantStatus.APPROVED
      ) {
        throw new Error(
          'impossible de rejeter une demande déjà bloquée ou acceptée',
        );
      }
    } else if (newStatus === RestaurantStatus.BLOCKED) {
      if (currentStatus === RestaurantStatus.APPROVED) {
        await this.prisma.restaurantRequest.update({
          where: { id: restaurantRequestId },
          data: { status: newStatus },
        });
        await this.prisma.restaurant.update({
          where: { id: currentRequest.restaurant_id },
          data: { status: newStatus },
        });
      } else if (
        currentStatus === RestaurantStatus.REJECTED ||
        currentStatus === RestaurantStatus.PENDING
      ) {
        throw new Error(
          'impossible de bloquer une demande déjà rejetée ou en attente',
        );
      }
    } else {
      throw new Error('Statut de mise à jour non autorisé');
    }

    // Recharger la demande mise à jour pour inclure les nouveaux détails
    const updatedRequest = await this.prisma.restaurantRequest.findUnique({
      where: { id: restaurantRequestId },
      include: { restaurant: true },
    });
    return updatedRequest;
  }
  async switchRestaurant(
    ownerId: number,
    restaurantId: number,
  ): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        status: RestaurantStatus.APPROVED,
        id: restaurantId,
        ownerId: ownerId,
      },
    });
    if (!restaurant) {
      throw new NotFoundException();
    }
    return restaurant;
  }
  async createMenu(
    ownerId: number,
    restaurantId: number,
    menuDto: MenuDto,
  ): Promise<Menu> {
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
        owner: { connect: { id: ownerId } },
      },
    });
    return menu;
  }
  async deleteMenu(restaurantId: number, menuId: number): Promise<void> {
    const menu = await this.prisma.menu.findUnique({
      where: { id: menuId },
      include: { restaurant: true, menuItems: true }, // Inclure les éléments de menu associés
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    if (menu.restaurant.id !== restaurantId) {
      throw new BadRequestException(
        'Menu does not belong to the specified restaurant',
      );
    }

    // Supprimer tous les éléments de menu associés au menu
    for (const menuItem of menu.menuItems) {
      await this.prisma.menuItem.delete({
        where: { id: menuItem.id },
      });
    }

    // Enfin, supprimer le menu lui-même
    await this.prisma.menu.delete({
      where: { id: menuId },
    });
  }
  async updateMenu(
    restaurantId: number,
    menuId: number,
    ownerId: number,
    menuDto: MenuDto,
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to update this menu',
      );
    }

    const menu = await this.prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return this.prisma.menu.update({
      where: { id: menuId },
      data: { ...menuDto },
    });
  }
  async createCategory(
    menuId: number,
    categoryDto: CategoryDto,
    userId: number, // Add userId parameter
  ): Promise<Category> {
    // Find the menu and include the associated restaurant
    const menu = await this.prisma.menu.findUnique({
      where: { id: menuId },
      include: { restaurant: true }, // Include the associated restaurant
    });

    // Check if the menu exists
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    // Check if the user is the owner of the restaurant associated with the menu
    if (menu.restaurant.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create a category for this menu',
      );
    }

    // Create the category
    const category = await this.prisma.category.create({
      data: {
        name: categoryDto.name,
        description: categoryDto.description,
        menu: { connect: { id: menuId } },
        restaurant: { connect: { id: menu.restaurant.id } }, // Use menu.restaurant.id instead of menu.restaurant_id
      },
    });

    return category;
  }

  async getCategories(menuId: number, userId: number): Promise<Category[]> {
    // Vérifiez si le menu existe et appartient à l'utilisateur
    const menu = await this.prisma.menu.findUnique({
      where: { id: menuId },
      include: { restaurant: true },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    if (menu.restaurant.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access these categories',
      );
    }

    const categories = await this.prisma.category.findMany({
      where: { menuId: menuId },
    });

    if (!categories || categories.length === 0) {
      throw new NotFoundException('No categories found');
    }

    return categories;
  }
  async getMenuItems(categoryId: number, userId: number): Promise<MenuItem[]> {
    // Vérifiez si la catégorie existe et appartient à l'utilisateur
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { menu: { include: { restaurant: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.menu.restaurant.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access these menu items',
      );
    }
    const menuItems = await this.prisma.menuItem.findMany({
      where: { categoryId: categoryId },
    });

    if (!menuItems || menuItems.length === 0) {
      throw new NotFoundException('No menu items found for this category');
    }

    return menuItems;
  }

  async addMenuItemToCategory(
    categoryId: number,
    menuItemDto: MenuItemDto,
    ownerId: number,
  ): Promise<MenuItem> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { menu: { include: { restaurant: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.menu.restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to add an item to this category',
      );
    }

    const menuItem = await this.prisma.menuItem.create({
      data: {
        name: menuItemDto.name,
        description: menuItemDto.description,
        price: menuItemDto.price,
        category: { connect: { id: categoryId } },
        menu: { connect: { id: category.menu.id } },
        restaurant: { connect: { id: category.menu.restaurant.id } },
      },
    });

    return menuItem;
  }
  async updateMenuItem(
    menuItemId: number,
    menuItemDto: MenuItemDto,
    ownerId: number,
  ): Promise<MenuItem> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        category: {
          include: {
            menu: {
              include: {
                restaurant: true,
              },
            },
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException('MenuItem not found');
    }

    if (menuItem.category.menu.restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to update this menu item',
      );
    }

    const updatedMenuItem = await this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: { ...menuItemDto },
    });

    return updatedMenuItem;
  }

  async deleteMenuItem(menuItemId: number, ownerId: number): Promise<void> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { menu: { include: { restaurant: true } } },
    });

    if (!menuItem) {
      throw new NotFoundException('MenuItem not found');
    }

    if (menuItem.menu.restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to delete this menu item',
      );
    }

    await this.prisma.menuItem.delete({
      where: { id: menuItemId },
    });
  }

  async updateCategory(
    updateCategoryDto: CategoryDto,
    userId: number,
    categoryId: number,
  ): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { menu: { include: { restaurant: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.menu.restaurant.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this category',
      );
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id: categoryId },
      data: updateCategoryDto,
    });

    return updatedCategory;
  }
  async deleteCategory(userId: number, categoryId: number): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { menu: { include: { restaurant: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.menu.restaurant.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this category',
      );
    }

    const deletedCategory = await this.prisma.category.delete({
      where: { id: categoryId },
    });

    return deletedCategory;
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
