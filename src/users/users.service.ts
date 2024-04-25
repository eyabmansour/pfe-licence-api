import { User } from './users.model';
import { PrismaService } from 'src/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterUsersDto } from 'src/authentification/dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUser(): Promise<User[]> {
    return this.prisma.user.findMany();
  }
  async createUser(data: RegisterUsersDto): Promise<User> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });
    if (existing) {
      throw new ConflictException('username already exists');
    }
    return this.prisma.user.create({
      data,
    });
  }
  async updateUser(
    userId: number,
    data: Partial<RegisterUsersDto>,
  ): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
  async deleteUser(userId: number): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.delete({
      where: { id: userId },
    });
    return true;
  }
}
