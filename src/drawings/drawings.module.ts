import { Module } from '@nestjs/common';
import { DrawingsService } from './drawings.service';
import { DrawingsController } from './drawings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '../media/media.module';
import { DrawingsEntity } from './entities/drawings.entity';
import { DrawingsAttributesEntity } from './entities/drawingsAttributes.entity';
import { CategoryEntity } from '../category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DrawingsEntity,
      DrawingsAttributesEntity,
      CategoryEntity,
    ]),
    MediaModule,
  ],
  controllers: [DrawingsController],
  providers: [DrawingsService],
})
export class DrawingsModule {}
