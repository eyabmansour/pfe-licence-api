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
  async register(
    createDto: RegisterUsersDto,
    roleCode: RoleCodeEnum,
  ): Promise<any> {
    const createUserObject = async () => {
      const createUsers = new User();
      createUsers.username = createDto.username;
      createUsers.email = createDto.email;
      createUsers.password = await bcrypt.hash(createDto.password, 10);
      return createUsers;
    };
    const createUsers = await createUserObject();
    const role = await this.prismaService.role.findUnique({
      where: { code: roleCode },
    });
    if (!role) {
      throw new Error(`Role with code ${roleCode} not found.`);
    }
    const userWithRole = {
      ...createUsers,
      role: { connect: { id: role.id } },
    };
    const user = await this.usersService.createUser(userWithRole);

    const payload: IJwtPayload = { username: user.username };

    return {
      token: this.jwtService.sign(payload),
    };
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
