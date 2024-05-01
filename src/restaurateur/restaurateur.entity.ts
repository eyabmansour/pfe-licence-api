import { Menu, MenuItem, Restaurant } from '@prisma/client';

export class entityType {
  menu: Menu[];
  menuItem: MenuItem[];
  restaurant: Restaurant[];
}
