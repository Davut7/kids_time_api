import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerController } from './logger.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import CustomLogger from './helpers/customLogger';
import { LogsEntity } from './entity/log.entity';
import { RedisModule } from '../redis/redis.module';
import { AdminTokenModule } from '../admin/token/token.module';


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
