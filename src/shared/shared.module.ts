import { Module } from '@nestjs/common';
import { MinioModule } from 'src/minio/minio.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [MinioModule, RedisModule],
  providers: [],
  exports: [MinioModule, RedisModule],
})
export class SharedModule {}
