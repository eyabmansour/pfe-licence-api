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
  Req,
  BadRequestException,
} from '@nestjs/common';
import { RestaurateurService } from './restaurateur.service';
import {
  Category,
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
  @Get('/:entityType')
  @MinRole(UserRole.RESTAURATEUR)
  async getEntities(
    @Param('entityType') entityType: 'restaurant' | 'menu' | 'menuItem',
  ): Promise<any[]> {
    return this.restaurateurService.getEntities(entityType);
  }
  @Get()
  async getUserRestaurants(@ReqUser() user: User): Promise<Restaurant[]> {
    return this.restaurateurService.getUserRestaurants(user.id);
  }
  @Get(':id/menus')
  async getRestaurantMenus(@Param('id') id: string, @ReqUser() user: User) {
    return this.restaurateurService.getRestaurantMenus(+id, user.id);
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
    @ReqUser() user: User,
  ): Promise<RestaurantRequest> {
    const { restaurantId } = requestData;
    return this.restaurateurService.submitRestaurantRequest(
      restaurantId,
      user.id,
    );
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
    @ReqUser() user: User,
    @Body('restaurantId') restaurantId: number,
  ): Promise<Restaurant> {
    return this.restaurateurService.switchRestaurant(user.id, restaurantId);
  }

  @Put('/:restaurantId/:menuId')
  async updateMenu(
    @Param('restaurantId') restaurantId: String,
    @Param('menuId') menuId: string,
    @Body() menuDto: MenuDto,
    @ReqUser() user: User,
  ) {
    return this.restaurateurService.updateMenu(
      +restaurantId,
      +menuId,
      user.id,
      menuDto,
    );
  }
  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: CategoryDto,
    @ReqUser() user: User,
  ): Promise<Category> {
    return this.restaurateurService.updateCategory(
      updateCategoryDto,
      user.id,
      +id,
    );
  }

  @Delete(':id')
  async deleteCategory(
    @Param('id') id: number,
    @ReqUser() user: User,
  ): Promise<Category> {
    return this.restaurateurService.deleteCategory(user.id, id);
  }
  @Get('categories/:menuId')
  async getCategories(@Param('menuId') menuId: number, @ReqUser() user: User) {
    if (!menuId || !user.id) {
      throw new BadRequestException('menuId and userId must be provided');
    }
    return this.restaurateurService.getCategories(menuId, user.id);
  }
  @Get('menu-items/categoryId')
  async getMenuItems(
    @Param('categoryId') categoryId: number,
    @ReqUser() user: User,
  ) {
    if (!categoryId || !user.id) {
      throw new BadRequestException('categoryId and userId must be provided');
    }
    return this.restaurateurService.getMenuItems(categoryId, user.id);
  }

  @Delete('menu/delete/:restaurantId/:menuId')
  @MinRole(UserRole.RESTAURATEUR)
  async deleteMenu(
    @Param('restaurantId') restaurantId: string,
    @Param('menuId') menuId: string,
  ): Promise<void> {
    return this.restaurateurService.deleteMenu(+restaurantId, +menuId);
  }
  @Delete('/delete/:menuId/:menuItemId')
  @MinRole(UserRole.RESTAURATEUR)
  async deleteMenuIem(
    @Param('menuItemId') menuItemId: string,
    @ReqUser() user: User,
  ): Promise<void> {
    return this.restaurateurService.deleteMenuItem(user.id, +menuItemId);
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
