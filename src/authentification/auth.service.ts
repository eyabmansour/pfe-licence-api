import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { RegisterUsersDto } from './dto/register-user.dto';
import { User } from 'src/users/users.model';
import { IJwtPayload } from './interfaces/jwt-payload.interface';
import { $Enums, RoleCodeEnum } from '@prisma/client';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ForgetPasswordResponse } from './dto/forget-password.response';
import { OperationStatusResponse } from 'src/common/filters/dto/operation-status.response';
import { MailService } from 'src/common/filters/MailService';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
    private readonly usersService: UsersService,
    private mailService: MailService,
  ) {}

  async login(loginDto: LoginDto): Promise<any> {
    const { username, password } = loginDto;
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const validatePassword = await bcrypt.compare(password, user.password);
    if (!validatePassword) {
      throw new UnauthorizedException();
    }
    return {
      token: this.jwtService.sign({ username }, {}),
    };
  }

  async register(createDto: RegisterUsersDto): Promise<any> {
    const createUser = new User();
    createUser.username = createDto.username;
    createUser.email = createDto.email;
    createUser.password = await bcrypt.hash(createDto.password, 10);
    const defaultRole = await this.prismaService.role.findUnique({
      where: { code: RoleCodeEnum.CLIENT },
    });
    if (!defaultRole) {
      throw new Error(`Default role with code ${defaultRole} not found.`);
    }
    const userWithRole = {
      ...createUser,
      role: { connect: { id: defaultRole.id } },
    };

    const createdUser = await this.usersService.createUser(userWithRole);

    const payload: IJwtPayload = { username: createdUser.username };
    const token = this.jwtService.sign(payload);

    return { token };
  }
  async updateUserRole(
    userId: number,
    newRoleCode: $Enums.RoleCodeEnum,
  ): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    const newRole = await this.prismaService.role.findUnique({
      where: { code: newRoleCode },
    });

    if (!newRole) {
      throw new Error(`Role with code ${newRoleCode} not found.`);
    }
    await this.prismaService.user.update({
      where: { id: userId },
      data: { role: { connect: { id: newRole.id } } },
    });

    return { message: 'User role updated successfully.' };
  }

  async validateToken(token: string, minRoleWeight?: number): Promise<User> {
    let payload: IJwtPayload;
    payload = this.jwtService.decode<IJwtPayload>(token);
    const user = await this.prismaService.user.findUnique({
      where: { username: payload.username },
      include: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (minRoleWeight) {
      if (!user.role || minRoleWeight > user.role.weight) {
        throw new ForbiddenException();
      }
    }
    return user;
  }

  private generateResetToken(userId: number): string {
    // Generate a unique token using JWT
    const resetToken = this.jwtService.sign(
      { sub: userId },
      {
        expiresIn: process.env.JWT_PASSWORD_EXPIRES_IN,
        secret: process.env.JWT_PASSWORD_SECRET,
      },
    );
    return resetToken;
  }

  async forgetPassword(
    forgetPasswordDto: ForgetPasswordDto,
  ): Promise<OperationStatusResponse> {
    const { email } = forgetPasswordDto;
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const token = this.generateResetToken(user.id);

    await this.mailService.sendPasswordResetEmail(user.email, token);

    return { status: true };
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    // Example JWT token verification:
    let decodedToken: any;
    try {
      decodedToken = this.jwtService.verify(resetToken, {
        secret: process.env.JWT_PASSWORD_SECRET,
      });
    } catch (error) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Retrieve user associated with the reset token
    const user = await this.prismaService.user.findUnique({
      where: { id: +decodedToken.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
  }
}
