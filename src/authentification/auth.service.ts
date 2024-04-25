import {
  ForbiddenException,
  Injectable,
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
import { RoleCodeEnum } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
    private readonly usersService: UsersService,
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
    const createUserObject = async () => {
      const createUser = new User();
      createUser.username = createDto.username;
      createUser.email = createDto.email;
      createUser.password = await bcrypt.hash(createDto.password, 10);
      return createUser;
    };
    const user = await createUserObject();
    const defaultRole = await this.prismaService.role.findUnique({
      where: { code: RoleCodeEnum.CLIENT },
    });
    if (!defaultRole) {
      throw new Error(`Default role with code ${defaultRole} not found.`);
    }
    const userWithRole = {
      ...user,
      role: { connect: { id: defaultRole.id } },
    };
    const createdUser = await this.usersService.createUser(userWithRole);
    const payload: IJwtPayload = { username: createdUser.username };
    const token = this.jwtService.sign(payload);

    return { token };
  }

  async updateUserRole(
    userId: number,
    newRoleCode: RoleCodeEnum,
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
    try {
      payload = this.jwtService.decode<IJwtPayload>(token);
    } catch (error) {
      throw new UnauthorizedException();
    }
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
}
