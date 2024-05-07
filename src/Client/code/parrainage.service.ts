import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  generateReferralCode(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const codeLength = 8;

    let referralCode = '';
    for (let i = 0; i < codeLength; i++) {
      referralCode += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    return referralCode;
  }

  async assignReferralCodeToUser(userId: number): Promise<string> {
    let referralCode = this.generateReferralCode();

    let existingUserWithCode = await this.prisma.user.findFirst({
      where: { referralCode: referralCode },
    });

    while (existingUserWithCode) {
      referralCode = this.generateReferralCode();
      existingUserWithCode = await this.prisma.user.findFirst({
        where: { referralCode: referralCode },
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: referralCode },
    });

    return referralCode;
  }
}
