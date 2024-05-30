import { Module } from '@nestjs/common';
import { ReferralService } from './parrainage.service';
import { ReferralController } from './parrainage.controller';
import { PrismaService } from 'src/prisma.service';
import { ClientService } from '../client.service';

@Module({
  controllers: [ReferralController],
  providers: [ReferralService, PrismaService, ClientService],
  exports: [ReferralService],
})
export class ReferralModule {}
