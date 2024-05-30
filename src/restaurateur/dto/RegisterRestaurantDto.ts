import { IsNotEmpty, IsEmail, IsPhoneNumber, IsEnum } from 'class-validator';
import { RestaurantStatus } from '@prisma/client';

export class RegisterRestaurantDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;

  @IsNotEmpty()
  openingHours: string;

  @IsNotEmpty()
  cuisineType: string;
}
