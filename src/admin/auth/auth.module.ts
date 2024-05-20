import { Module } from '@nestjs/common';
import { AdminAuthService } from './auth.service';
import { AdminAuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from '../user/entities/adminUser.entity';
import { AdminTokenEntity } from '../token/entities/token.entity';
import { AdminTokenModule } from '../token/token.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUserEntity, AdminTokenEntity]),
    AdminTokenModule,
    RedisModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
})
export class AdminAuthModule {}
