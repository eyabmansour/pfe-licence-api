import { User } from './users.model';
import { PrismaService } from 'src/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUsersDto } from 'src/authentification/dto/register-user.dto';
import { ChangePasswordDto } from './dto.ts/ChangePassword';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/common/filters/MailService';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async getAllUser(): Promise<User[]> {
    return this.prisma.user.findMany();
  }
  async getUserProfil(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        restaurants: true,
        orders: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User Not Found !');
    }
    return user;
  }
  async createUser(data: RegisterUsersDto): Promise<User> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });
    if (existing) {
      throw new ConflictException('username already exists');
    }
    return this.prisma.user.create({
      data,
    });
  }
  async updateUser(
    userId: number,
    data: Partial<RegisterUsersDto>,
  ): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
  async deleteUser(userId: number): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.delete({
      where: { id: userId },
    });
    return true;
  }
  async updateUserProfile(
    userId: number,
    updatedData: Partial<RegisterUsersDto>,
  ): Promise<User> {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Mettre à jour les données utilisateur
    return this.prisma.user.update({
      where: { id: userId },
      data: updatedData,
    });
  }

  async deleteUserProfile(userId: number): Promise<void> {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Supprimer l'utilisateur
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<boolean> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Find the user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify the current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  }

  async generateToken(username: string): Promise<string> {
    const token = this.jwtService.sign({ username }, { expiresIn: '1h' });
    return token;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    // Generate a reset token (you can use JWT or any other method)
    const resetToken = this.generateResetToken();

    // Store the reset token in the database associated with the user
    /*await this.prisma.resetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
      },
    });*/

    // Send the reset token to the user via email
    await this.mailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    // Example JWT token verification:
    let decodedToken: any;
    try {
      decodedToken = this.jwtService.verify(resetToken);
    } catch (error) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Retrieve user associated with the reset token
    const user = await this.prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
  }

  private generateResetToken(): string {
    // Generate a unique token using JWT
    const resetToken = this.jwtService.sign({}, { expiresIn: '1h' });
    return resetToken;
  }
  async uploadImage(userId: number, imageUrl: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { imageUrl: imageUrl },
    });
  }

  async deleteImage(userId: number): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { imageUrl: null },
    });
  }
}
