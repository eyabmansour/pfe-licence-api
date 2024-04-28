import { Restaurant, Menu, MenuItem, RestaurantStatus } from '@prisma/client';

export class RegisterRestaurantDto {
  restaurant: Restaurant;
  menu: Menu;
  menuItems: MenuItem[];
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  openingHours: string;
  cuisineType: string;
  Status: RestaurantStatus;
}
