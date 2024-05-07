import { Module } from '@nestjs/common';
import { ReferralService } from './parrainage.service';
import { ReferralController } from './parrainage.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ReferralController],
  providers: [ReferralService, PrismaService],
  exports: [ReferralService],
})
export class ReferralModule {}
