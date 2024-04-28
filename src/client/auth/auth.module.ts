import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { TokenEntity } from '../token/entities/token.entity';
import { TokenModule } from '../token/token.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { RedisModule } from '../../redis/redis.module';
import { MailsModule } from '../../mails/mails.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TokenEntity]),
    TokenModule,
    MailsModule,
    UserModule,
    PassportModule,
    RedisModule,
    ThrottlerModule.forRoot([
      {
        name: 'resend-code',
        ttl: 120,
        limit: 1,
      },
      {
        name: 'login',
        ttl: 3600,
        limit: 10,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}
