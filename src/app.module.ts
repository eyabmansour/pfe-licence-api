import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './authentification/auth.module';
import { RestaurateurModule } from './restaurateur/restaurateur.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ClientModule } from './Client/client.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    RestaurateurModule,
    ClientModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
