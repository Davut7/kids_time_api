import { Module } from '@nestjs/common';
import { AdminUserService } from './user.service';
import { AdminUserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from './entities/adminUser.entity';
import { AdminTokenModule } from '../token/token.module';
import { AdminTokenEntity } from '../token/entities/token.entity';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUserEntity, AdminTokenEntity]),
    AdminTokenModule,
    RedisModule,
  ],
  controllers: [AdminUserController],
  providers: [AdminUserService],
  exports: [AdminUserService],
})
export class AdminUserModule {}
