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
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/authentification/auth.guard';
import { UserRole } from 'src/roles/user-role.model';
import { User } from '@prisma/client';
import { MinRole } from 'src/roles/min-role.decorator';
import { ReqUser } from 'src/authentification/decorators/req-user.decorator';
import { ChangePasswordDto } from './dto.ts/ChangePassword';
import { SendPasswordResetLinkDto } from './dto.ts/send-password-reset-link.dto';
import { ResetPasswordDto } from './dto.ts/reset-password.dto';
import { RegisterUsersDto } from 'src/authentification/dto/register-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../restaurateur/Multer/multer.config';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}
  @Get('/allUsers')
  @MinRole(UserRole.ADMINISTRATOR)
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
  @Get('profile')
  async getUserProfile(@ReqUser() user: User) {
    return this.userService.getUserProfil(user.id);
  }
  @Post()
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
    @Param('id') userId: string,
    @Body() userData: User,
    @Res() response: Response,
  ): Promise<any> {
    const updatedUser = await this.userService.updateUser(+userId, userData);
    if (!updatedUser) {
      return response.status(404).json({
        status: 'ERROR!',
        message: 'User not found',
      });
    }
    return response.status(200).json(updatedUser);
  }
  @Delete(':id')
  @MinRole(UserRole.ADMINISTRATOR)
  async deleteUser(
    @Param('id') userId: string,
    @Res() response: Response,
  ): Promise<any> {
    const deleted = await this.userService.deleteUser(+userId);
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
  @Patch('/updateProfil')
  async updateUserProfile(
    @ReqUser() user: User,
    @Body() updateData: Partial<RegisterUsersDto>,
  ) {
    const updatedUser = await this.userService.updateUserProfile(
      user.id,
      updateData,
    );
    return updatedUser;
  }

  @Delete('/deleteProfil')
  async deleteUserProfile(@ReqUser() user: User) {
    await this.userService.deleteUserProfile(user.id);
    return { message: 'User profile deleted successfully' };
  }

  @UseGuards(AuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.id;
    await this.userService.changePassword(userId, changePasswordDto);
    return { message: 'Password changed successfully' };
  }
  @Post('password/reset/request')
  async requestPasswordReset(
    @Body() requestDto: SendPasswordResetLinkDto,
  ): Promise<void> {
    await this.userService.requestPasswordReset(requestDto.email);
  }

  @Post('password/reset')
  async resetPassword(@Body() resetDto: ResetPasswordDto): Promise<void> {
    await this.userService.resetPassword(resetDto.token, resetDto.newPassword);
  }
  @Post('/images')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async uplodeImage(
    @ReqUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = file.path;
    await this.userService.uploadImage(user.id, imageUrl);
    return { message: 'Image Upload successfuly ', imageUrl };
  }
  @Delete('/images')
  async deleteImage(@ReqUser() user: User) {
    await this.userService.deleteImage(user.id);
    return { message: 'Image deleted successfully' };
  }
}
