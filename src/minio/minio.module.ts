import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [MinioService, ConfigService, ConfigModule],
  exports: [MinioService],
})
export class MinioModule {}
