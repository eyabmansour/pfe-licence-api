import { RoleCodeEnum } from '@prisma/client';
import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterUsersDto {
  roleCode?: RoleCodeEnum;
  @IsString()
  @Length(5, 10)
  username: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsEmail()
  email: string;
}
