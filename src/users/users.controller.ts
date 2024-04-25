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
import { UserRole } from 'src/roles/user-role.model';
import { User } from './users.model';
import { MinRole } from 'src/roles/min-role.decorator';

@Controller('users')
@UseGuards(AuthGuard)
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
  @MinRole(UserRole.ADMINISTRATOR)
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
  @MinRole(UserRole.ADMINISTRATOR)
  async updateUser(
    @Param('id') userId: number,
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
  @MinRole(UserRole.ADMINISTRATOR) // Only administrators can delete users
  async deleteUser(
    @Param('id') userId: number,
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
