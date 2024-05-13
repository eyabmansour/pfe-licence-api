import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { User } from '@prisma/client';
import { Order } from '@prisma/client';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendReferralSuccessEmail(user: User, promoCode: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_USERNAME,
      to: user.email,
      subject: 'Parrainage réussi',
      text: `Félicitations ${user.username} ! Votre ami a utilisé votre code promotionnel (${promoCode}). Vous avez été récompensé pour votre parrainage.`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendOrderConfirmationEmail(user: User, order: Order): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_USERNAME,
      to: user.email,
      subject: 'Confirmation de commande',
      text: `Bonjour ${user.username}, merci pour votre commande ! Votre commande a été reçue avec succès.`,
      html: `<p>Bonjour ${user.username},</p><p>Merci pour votre commande !</p><p>Votre commande a été reçue avec succès.</p><p>Numéro de commande: ${order.id}</p><p>Total: ${order.totalPrice} €</p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(user: User, resetLink: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_USERNAME,
      to: user.email,
      subject: 'Réinitialisation de mot de passe',
      text: `Bonjour ${user.username}, vous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe : ${resetLink}`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendCustomEmail(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_USERNAME,
      to,
      subject,
      text,
    };

    await this.transporter.sendMail(mailOptions);
  }
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_USERNAME,
      to: email,
      subject: 'Bienvenue sur notre plateforme',
      text: `Bienvenue sur notre plateforme, ${username} ! Nous sommes ravis de vous accueillir.`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}