import { Module } from '@nestjs/common';
import { RestaurateurController } from './restaurateur.controller';
import { RestaurateurService } from './restaurateur.service';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/authentification/auth.module';

@Module({
  controllers: [RestaurateurController],
  providers: [RestaurateurService, PrismaService],
  imports: [UsersModule, AuthModule],
})
export class RestaurateurModule {}
