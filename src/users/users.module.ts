import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from 'src/authentification/auth.service';
import { JwtService } from '@nestjs/jwt';
@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, AuthService, JwtService],
})
export class UsersModule {}
