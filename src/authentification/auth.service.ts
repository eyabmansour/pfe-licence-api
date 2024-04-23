import {
  Injectable,
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
    const createUsers = new User();
    createUsers.username = createDto.username;
    createUsers.email = createDto.email;
    createUsers.password = await bcrypt.hash(createDto.password, 10);

    const user = await this.usersService.createUser(createUsers);

    return {
      token: this.jwtService.sign({ username: user.username }),
    };
  }

  async validateToken(token: string): Promise<User> {
    let payload;
    try {
      payload = this.jwtService.decode(token);
    } catch (error) {
      throw new UnauthorizedException();
    }
    const user = await this.prismaService.user.findUnique({
      where: { username: payload.username },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
