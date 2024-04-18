import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinioModule } from 'src/minio/minio.module';
import { MediaEntity } from './entities/mediaEntity';

@Module({
  imports: [TypeOrmModule.forFeature([MediaEntity]), MinioModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
