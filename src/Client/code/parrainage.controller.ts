import { Controller, Post, Body, Param } from '@nestjs/common';
import { ReferralService } from './parrainage.service';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post(':userId')
  async assignReferralCode(@Param('userId') userId: string): Promise<string> {
    const referralCode =
      await this.referralService.assignReferralCodeToUser(+userId);
    return referralCode;
  }
}
