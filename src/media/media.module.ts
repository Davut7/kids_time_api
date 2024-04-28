import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaEntity } from './entities/mediaEntity';
import { MinioService } from '../minio/minio.service';
import { MinioModule } from '../minio/minio.module';


@Module({
  imports: [TypeOrmModule.forFeature([MediaEntity]), MinioModule],
  providers: [MediaService, MinioService],
  exports: [MediaService, MinioService],
})
export class MediaModule {}
