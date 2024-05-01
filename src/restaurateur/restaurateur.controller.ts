import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  Delete,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { RestaurateurService } from './restaurateur.service';
import {
  Menu,
  Restaurant,
  RestaurantRequest,
  RestaurantStatus,
} from '@prisma/client';
import { RegisterRestaurantDto } from './dto/RegisterRestaurantDto';
import { SubmitRestaurantRequestDto } from './dto/SubmitRestaurantRequestDto';
import { MinRole } from 'src/roles/min-role.decorator';
import { UserRole } from 'src/roles/user-role.model';
import { MenuDto } from './dto/MenuDto';
import { MenuItemDto } from './dto/MenuItemDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from './Multer/multer.config';

@Controller('restaurants')
export class RestaurateurController {
  constructor(private readonly restaurateurService: RestaurateurService) {}
  @Post('/register/:id')
  async register(
    @Param('id') ownerId: number,
    @Body() restaurantData: RegisterRestaurantDto,
  ): Promise<Restaurant> {
    return this.restaurateurService.register(restaurantData, ownerId);
  }
  @Get('users/:userId/restaurants')
  @MinRole(UserRole.ADMINISTRATOR)
  async getUserRestaurants(@Param('userId') userId: number): Promise<any> {
    try {
      const userRestaurants =
        await this.restaurateurService.getRestaurantsByUserId(userId);
      return {
        data: userRestaurants,
        message: 'User restaurants fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching user restaurants:', error);
      return { error: 'Failed to fetch user restaurants' };
    }
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
  @Patch('/switch/:id')
  @MinRole(UserRole.RESTAURATEUR)
  async switchRestaurant(
    @Param('id') ownerId: number,
    @Body('restaurantId') restaurantId: number,
  ): Promise<Restaurant> {
    return this.restaurateurService.switchRestaurant(ownerId, restaurantId);
  }
  @Post(':id/menus')
  @MinRole(UserRole.RESTAURATEUR)
  async createMenu(
    @Param('id') restaurantId: number,
    @Body() menuDto: MenuDto,
  ): Promise<Menu> {
    return this.restaurateurService.createMenu(restaurantId, menuDto);
  }
  @Post('menus/:id/menuItems')
  @MinRole(UserRole.RESTAURATEUR)
  async addMenuItemToMenu(
    @Param('id') menuId: number,
    @Body() menuItemDto: MenuItemDto,
  ): Promise<any> {
    return this.restaurateurService.addMenuItemToMenu(menuId, menuItemDto);
  }
  @Post(':entityType/:entityId/images')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async uploadImage(
    @Param('entityType') entityType: 'Restaurant' | 'Menu' | 'MenuItem',
    @Param('entityId') entityId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = file.path;
    await this.restaurateurService.uploadImage(entityType, entityId, imageUrl);
    return { message: 'Image uploaded successfully', imageUrl };
  }
  @Delete(':entityType/:entityId/images')
  async deleteImage(
    @Param('entityType') entityType: 'Restaurant' | 'Menu' | 'MenuItem',
    @Param('entityId') entityId: number,
  ) {
    try {
      await this.restaurateurService.deleteImage(entityType, entityId);
      return { message: 'Image deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Put(':entityType/:entityId/image')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async updateImage(
    @Param('entityType') entityType: 'Restaurant' | 'Menu' | 'MenuItem',
    @Param('entityId') entityId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const imageUrl = file.path;
      await this.restaurateurService.uploadImage(
        entityType,
        entityId,
        imageUrl,
      );
      return { message: 'Image updated successfully', imageUrl };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
