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
  Put,
  UseGuards,
} from '@nestjs/common';
import { RestaurateurService } from './restaurateur.service';
import {
  Menu,
  Restaurant,
  RestaurantRequest,
  RestaurantStatus,
  User,
} from '@prisma/client';
import { RegisterRestaurantDto } from './dto/RegisterRestaurantDto';
import { SubmitRestaurantRequestDto } from './dto/SubmitRestaurantRequestDto';
import { MinRole } from 'src/roles/min-role.decorator';
import { UserRole } from 'src/roles/user-role.model';
import { MenuDto } from './dto/MenuDto';
import { MenuItemDto } from './dto/MenuItemDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from './Multer/multer.config';
import { AuthGuard } from 'src/authentification/auth.guard';
import { ReqUser } from 'src/authentification/decorators/req-user.decorator';
import { CategoryDto } from './dto/CategorieDto';

@Controller('restaurants')
@UseGuards(AuthGuard)
export class RestaurateurController {
  constructor(private readonly restaurateurService: RestaurateurService) {}
  @Post('/register')
  async register(
    @Body() restaurantData: RegisterRestaurantDto,
    @ReqUser() user: User,
  ): Promise<Restaurant> {
    return this.restaurateurService.register(restaurantData, user.id);
  }
  @MinRole(UserRole.RESTAURATEUR)
  @Get('/:entityType')
  async getEntities(
    @Param('entityType') entityType: 'restaurant' | 'menu' | 'menuItem',
  ): Promise<any[]> {
    return this.restaurateurService.getEntities(entityType);
  }
  @Get()
  async getUserRestaurants(@ReqUser() user: User): Promise<Restaurant[]> {
    return this.restaurateurService.getUserRestaurants(user.id);
  }
  /* @Get('users/:userId/restaurants')
  @MinRole(UserRole.ADMINISTRATOR)
  async getUserRestaurants(@Param('userId') userId: string): Promise<any> {
    const userRestaurants =
      await this.restaurateurService.getRestaurantsByUserId(+userId);
    return {
      data: userRestaurants,
      message: 'User restaurants fetched successfully',
    };
  }*/

  @Post('/request')
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
    @Param('id') requestId: string,
    @Param('status') status: RestaurantStatus,
  ): Promise<RestaurantRequest> {
    return this.restaurateurService.updateRestaurantStatus(+requestId, status);
  }
  @Patch('/switch/:id')
  async switchRestaurant(
    @Param('id') ownerId: string,
    @Body('restaurantId') restaurantId: number,
  ): Promise<Restaurant> {
    return this.restaurateurService.switchRestaurant(+ownerId, restaurantId);
  }
  @Post('/categorie/:restaurantId')
  async createCategory(
    @Param('restaurantId') restaurantId: string,
    @Body() categoryDto: CategoryDto,
  ): Promise<any> {
    const category = await this.restaurateurService.createCategory(
      +restaurantId,
      categoryDto,
    );
    return category;
  }
  @Post('categories/:categoryId/menus/:menuId')
  async addMenuToCategory(
    @Param('categoryId') categoryId: string,
    @Param('menuId') menuId: string,
  ) {
    return this.restaurateurService.addMenuToCategory(+categoryId, +menuId);
  }
  @Post(':id/menus')
  async createMenu(
    @Param('id') restaurantId: string,
    @Body() menuDto: MenuDto,
  ): Promise<Menu> {
    return this.restaurateurService.createMenu(+restaurantId, menuDto);
  }
  @Delete('menu/delete/:restaurantId/:menuId')
  @MinRole(UserRole.RESTAURATEUR)
  async deleteMenu(
    @Param('restaurantId') restaurantId: string,
    @Param('menuId') menuId: string,
  ): Promise<void> {
    return this.restaurateurService.deleteMenu(+restaurantId, +menuId);
  }
  @Delete('menu/item/delete/:menuId/:menuItemId')
  @MinRole(UserRole.RESTAURATEUR)
  async deleteMenuIem(
    @Param('menuId') menuId: string,
    @Param('menuItemId') menuItemId: string,
  ): Promise<void> {
    return this.restaurateurService.deleteMenuItem(+menuId, +menuItemId);
  }
  @Post('menus/:id/menuItems')
  async addMenuItemToMenu(
    @Param('id') menuId: string,
    @Body() menuItemDto: MenuItemDto,
  ): Promise<any> {
    return this.restaurateurService.addMenuItemToMenu(+menuId, menuItemDto);
  }
  @Post(':entityType/:entityId/images')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async uploadImage(
    @Param('entityType') entityType: 'Restaurant' | 'Menu' | 'MenuItem',
    @Param('entityId') entityId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = file.path;
    await this.restaurateurService.uploadImage(entityType, +entityId, imageUrl);
    return { message: 'Image uploaded successfully', imageUrl };
  }
  @Delete(':entityType/:entityId/images')
  async deleteImage(
    @Param('entityType') entityType: 'Restaurant' | 'Menu' | 'MenuItem',
    @Param('entityId') entityId: string,
  ) {
    await this.restaurateurService.deleteImage(entityType, +entityId);
    return { message: 'Image deleted successfully' };
  }
  @Put(':entityType/:entityId/image')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async updateImage(
    @Param('entityType') entityType: 'Restaurant' | 'Menu' | 'MenuItem',
    @Param('entityId') entityId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = file.path.replace('public', '');
    await this.restaurateurService.uploadImage(entityType, +entityId, imageUrl);
    return { message: 'Image updated successfully', imageUrl };
  }
}
