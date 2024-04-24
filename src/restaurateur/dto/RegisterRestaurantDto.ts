import { Restaurant, Menu, MenuItem } from '@prisma/client';

export class RegisterRestaurantDto {
  restaurant: Restaurant;
  menu: Menu;
  menuItems: MenuItem[];
}
