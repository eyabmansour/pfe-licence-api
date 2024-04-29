import { Controller, Post, Body, Req, Res, Put, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-user.dto';
import { Request, Response } from 'express';
import { RegisterUsersDto } from './dto/register-user.dto';
import { RoleCodeEnum } from '@prisma/client';
import { MinRole } from 'src/roles/min-role.decorator';
import { UserRole } from 'src/roles/user-role.model';
@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Req() request: Request,
    @Res() response: Response,
    @Body() loginDto: LoginDto,
  ): Promise<any> {
    try {
      const result = await this.authService.login(loginDto);
      return response.status(200).json({
        status: 'OK!',
        message: 'Successfully login!',
        result: result,
      });
    } catch (err) {
      return response.status(500).json({
        status: 'ERROR!',
        message: 'Internal Server Error!',
      });
    }
  }
  @Post('/register')
  async register(
    @Req() request: Request,
    @Res() response: Response,
    @Body() registerDto: RegisterUsersDto,
  ): Promise<any> {
    try {
      const result = await this.authService.register(registerDto);
      return response.status(200).json({
        status: 'OK!',
        message: 'Successfully register users!',
        result: result,
      });
    } catch (err) {
      return response.status(500).json({
        status: 'ERROR!',
        message: 'Internal Server Error!',
      });
    }
  }

  @Put(':id')
  @MinRole(UserRole.ADMINISTRATOR)
  async updateUserRole(
    @Param('id') userId: number,
    @Body() newRoleCode: RoleCodeEnum,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const updateUserRole = await this.authService.updateUserRole(
        userId,
        newRoleCode,
      );
      if (!updateUserRole) {
        return response.status(404).json({
          status: 'ERROR!',
          message: 'User not found',
        });
      }
      return response.status(200).json(updateUserRole);
    } catch (err) {
      return response.status(500).json({
        status: 'ERROR!',
        message: 'Internal Server Error',
      });
    }
  }
}
