import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerController } from './logger.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import CustomLogger from './helpers/customLogger';
import { LogsEntity } from './entity/log.entity';
import { AdminTokenModule } from 'src/admin/token/token.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogsEntity]),
    RedisModule,
    AdminTokenModule,
  ],
  controllers: [LoggerController],
  providers: [LoggerService, CustomLogger],
  exports: [CustomLogger],
})
export class LoggerModule {}
