import { Module } from '@nestjs/common';
import { RestaurateurController } from './restaurateur.controller';
import { RestaurateurService } from './restaurateur.service';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [RestaurateurController],
  providers: [RestaurateurService, PrismaService],
  imports: [UsersModule],
})
export class RestaurateurModule {}
