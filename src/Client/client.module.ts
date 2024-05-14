import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { PrismaService } from 'src/prisma.service';
import { EventService } from './code/service/event.service';

@Module({
  controllers: [ClientController],
  providers: [ClientService, PrismaService, EventService],
})
export class ClientModule {}
