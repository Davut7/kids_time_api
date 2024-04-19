import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '../media/media.module';
import { SharedModule } from 'src/shared/shared.module';
import { AdminTokenModule } from 'src/admin/token/token.module';
import { CategoryEntity } from './entities/category.entity';
import { CategoryAttributesEntity } from './entities/categoryAttributes.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity, CategoryAttributesEntity]),
    MediaModule,
    SharedModule,
    AdminTokenModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
