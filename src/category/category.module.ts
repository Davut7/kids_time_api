import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '../media/media.module';
import { CategoryEntity } from './entities/category.entity';
import { CategoryAttributesEntity } from './entities/categoryAttributes.entity';
import { AdminTokenModule } from '../admin/token/token.module';
import { RedisModule } from '../redis/redis.module';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity, CategoryAttributesEntity]),
    MediaModule,
    AdminTokenModule,
    RedisModule,
    MinioModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
