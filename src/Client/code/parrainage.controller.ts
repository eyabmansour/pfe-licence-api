import { Controller, Post, Body, Param } from '@nestjs/common';
import { ReferralService } from './parrainage.service';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}
  @Post('assign-referral-codes')
  async assignReferralCodes(
    @Body() body: any, // Use 'any' type for debugging
  ): Promise<number> {
    console.log('Request Body:', body);
    const minOrderCount = body.minOrderCount;
    console.log('minOrderCount:', minOrderCount);
    return this.referralService.assignReferralCodeToEligibleUsers(
      minOrderCount,
    );
  }
}
