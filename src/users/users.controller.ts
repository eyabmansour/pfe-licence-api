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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/authentification/auth.guard';
import { Roles } from 'src/roles/roles.decorator';
import { UserRole } from 'src/roles/user-role.model';
import { User } from './users.model';
import { RolesGuard } from 'src/roles/roles.guard';

@Controller('users')
@UseGuards(AuthGuard)
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  async getAllUsers(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const result = await this.userService.getAllUser();
      return response.status(200).json({
        status: 'Ok!',
        message: 'Successfully fetch data!',
        result: result,
      });
    } catch (err) {
      return response.status(500).json({
        status: 'ERROR!',
        message: 'internal Server Error',
      });
    }
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR)
  async createUser(
    @Body() userData: User,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const newUser = await this.userService.createUser(userData);
      return response.status(201).json(newUser);
    } catch (err) {
      return response.status(500).json({
        status: 'ERROR!',
        message: 'Internal Server Error',
      });
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR) // Administrators and users can update their own profile
  async updateUser(
    @Param('id') userId: string,
    @Body() userData: User,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const updatedUser = await this.userService.updateUser(userId, userData);
      if (!updatedUser) {
        return response.status(404).json({
          status: 'ERROR!',
          message: 'User not found',
        });
      }
      return response.status(200).json(updatedUser);
    } catch (err) {
      return response.status(500).json({
        status: 'ERROR!',
        message: 'Internal Server Error',
      });
    }
  }
  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR) // Only administrators can delete users
  async deleteUser(
    @Param('id') userId: string,
    @Res() response: Response,
  ): Promise<any> {
    try {
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
    } catch (err) {
      return response.status(500).json({
        status: 'ERROR!',
        message: 'Internal Server Error',
      });
    }
  }
}
