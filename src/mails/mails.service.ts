import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { CreateMailDto } from './dto/createMail.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailsService {
  constructor(
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendMail(dto: CreateMailDto) {
    if (process.env.NODE_ENV === 'development')
      return { message: 'Mail send successfully!' };
    await this.mailerService.sendMail({
      to: dto.email,
      from: this.configService.getOrThrow('SMTP_USER'),
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
      if (process.env.NODE_ENV === 'development')
        return { message: 'Verification code send successfully!' };
      await this.mailerService.sendMail({
        to: email,
        from: this.configService.getOrThrow('SMTP_USER'),
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
