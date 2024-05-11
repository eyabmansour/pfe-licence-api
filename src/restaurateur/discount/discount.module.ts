import { Module } from '@nestjs/common';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';
import { PrismaService } from 'src/prisma.service';
import { ClientService } from 'src/Client/client.service';
@Module({
  controllers: [DiscountController],
  providers: [DiscountService, PrismaService, ClientService],
})
export class DiscountModule {}
