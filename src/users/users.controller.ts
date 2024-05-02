import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Res,
  Req,
  UseGuards,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/authentification/auth.guard';
import { UserRole } from 'src/roles/user-role.model';
import { User } from './users.model';
import { MinRole } from 'src/roles/min-role.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  async getAllUsers(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<any> {
    const result = await this.userService.getAllUser();
    return response.status(200).json({
      status: 'Ok!',
      message: 'Successfully fetch data!',
      result: result,
    });
  }
  @Post()
  @MinRole(UserRole.ADMINISTRATOR)
  async createUser(
    @Body() userData: User,
    @Res() response: Response,
  ): Promise<any> {
    const newUser = await this.userService.createUser(userData);
    return response.status(201).json(newUser);
  }
  @Put(':id')
  @MinRole(UserRole.ADMINISTRATOR)
  async updateUser(
    @Param('id') userId: number,
    @Body() userData: User,
    @Res() response: Response,
  ): Promise<any> {
    const updatedUser = await this.userService.updateUser(userId, userData);
    if (!updatedUser) {
      return response.status(404).json({
        status: 'ERROR!',
        message: 'User not found',
      });
    }
    return response.status(200).json(updatedUser);
  }
  @Delete(':id')
  @MinRole(UserRole.ADMINISTRATOR) // Only administrators can delete users
  async deleteUser(
    @Param('id') userId: number,
    @Res() response: Response,
  ): Promise<any> {
    const deleted = await this.userService.deleteUser(userId);
    if (!deleted) {
      return response.status(404).json({
        status: 'ERROR!',
        message: 'User not found',
      });
    }
    return response.status(200).json({
      status: 'OK!',
      message: 'User deleted successfully',
    });
  }
}
