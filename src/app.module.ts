import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './authentification/auth.module';
import { RestaurateurModule } from './restaurateur/restaurateur.module';

@Module({
  imports: [UsersModule, AuthModule, RestaurateurModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
