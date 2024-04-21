import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MailsService } from './mails.service';
import { CreateMailDto } from './dto/createMail.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UserAuthGuard } from 'src/helpers/guards/userAuth.guard';

@ApiTags('mails')
@Controller('mails')
export class MailsController {
  constructor(private readonly mailsService: MailsService) {}

  @ApiResponse({ description: 'Mail sended successfully!' })
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @UseGuards(ThrottlerGuard)
  @UseGuards(UserAuthGuard)
  @Post()
  sendMail(@Body() dto: CreateMailDto) {
    return this.mailsService.sendMail(dto);
  }
}
