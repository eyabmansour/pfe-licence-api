import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from 'src/authentification/auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MailService } from 'src/common/filters/MailService';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    AuthService,
    JwtService,
    MailService,
  ],
})
export class UsersModule {}
