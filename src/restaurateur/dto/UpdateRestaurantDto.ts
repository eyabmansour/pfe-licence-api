import { IsNotEmpty, IsEmail, IsPhoneNumber, IsEnum } from 'class-validator';

export class UpdateRestaurantDto {
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
