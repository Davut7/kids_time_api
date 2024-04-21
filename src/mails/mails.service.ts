import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { CreateMailDto } from './dto/createMail.dto';

@Injectable()
export class MailsService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(dto: CreateMailDto) {
    await this.mailerService.sendMail({
      to: process.env.SMTP_USER,
      from: dto.email,
      subject: 'Request information',
      html: `
        <div>
        <p>${dto.email}</p>
        <p>${dto.firstName}</p>
        <p>${dto.message}</p>
        </div>
      `,
    });

    return { message: 'Mail send successfully!' };
  }

  async sendVerificationCode(verificationCode: string, email: string) {
    try {
      await this.mailerService.sendMail({
        to: process.env.SMTP_USER,
        from: email,
        subject: 'Verification code',
        html: `
        <div>
        <p>Verification code ${verificationCode}</p>
        </div>
      `,
      });

      return { message: 'Verification code send successfully!' };
    } catch (error) {
      console.log('Error while sending verification code', error);
    }
  }
}
