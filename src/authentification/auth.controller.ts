import { Controller, Post, Body, Req, Res, Put, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-user.dto';
import { Request, Response } from 'express';
import { RegisterUsersDto } from './dto/register-user.dto';
import { RoleCodeEnum } from '@prisma/client';
import { MinRole } from 'src/roles/min-role.decorator';
import { UserRole } from 'src/roles/user-role.model';
import { MailService } from 'src/common/filters/MailService';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { OperationStatusResponse } from 'src/common/filters/dto/operation-status.response';
import { ResetPasswordDto } from 'src/users/dto.ts/reset-password.dto';
@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  @Post('/login')
  async login(
    @Req() request: Request,
    @Res() response: Response,
    @Body() loginDto: LoginDto,
  ): Promise<any> {
    const result = await this.authService.login(loginDto);
    return response.status(200).json({
      status: 'OK!',
      message: 'Successfully login!',
      result: result,
    });
  }
  @Post('/register')
  async register(
    @Req() request: Request,
    @Res() response: Response,
    @Body() registerDto: RegisterUsersDto,
  ): Promise<any> {
    const result = await this.authService.register(registerDto);

    return response.status(200).json({
      status: 'OK!',
      message: 'Successfully register users!',
      result: result,
    });
  }
  @Put(':id')
  @MinRole(UserRole.ADMINISTRATOR)
  async updateUserRole(
    @Param('id') userId: string,
    @Body() newRoleCode: RoleCodeEnum,
    @Res() response: Response,
  ): Promise<any> {
    const updateUserRole = await this.authService.updateUserRole(
      +userId,
      newRoleCode,
    );
    if (!updateUserRole) {
      return response.status(404).json({
        status: 'ERROR!',
        message: 'User not found',
      });
    }
    return response.status(200).json(updateUserRole);
  }

  @Post('forget-password')
  async forgetPassword(
    @Body()
    forgetPasswordDto: ForgetPasswordDto,
  ): Promise<OperationStatusResponse> {
    return this.authService.forgetPassword(forgetPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetDto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(resetDto.token, resetDto.newPassword);
  }
}
