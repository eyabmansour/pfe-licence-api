import { Restaurant } from '@prisma/client';

export class Restaurateur {
  id: number;
  name: string;
  email: string;
  restaurants: Restaurant[];
}
