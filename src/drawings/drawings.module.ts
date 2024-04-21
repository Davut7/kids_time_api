import { Module } from '@nestjs/common';
import { DrawingsService } from './drawings.service';
import { DrawingsController } from './drawings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '../media/media.module';
import { SharedModule } from 'src/shared/shared.module';
import { AdminTokenModule } from 'src/admin/token/token.module';
import { DrawingsEntity } from './entities/drawings.entity';
import { DrawingsAttributesEntity } from './entities/drawingsAttributes.entity';
import { CategoryEntity } from 'src/category/entities/category.entity';
import { TokenModule } from 'src/client/token/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DrawingsEntity,
      DrawingsAttributesEntity,
      CategoryEntity,
    ]),
    MediaModule,
    SharedModule,
    AdminTokenModule,
    TokenModule
  ],
  controllers: [DrawingsController],
  providers: [DrawingsService],
})
export class DrawingsModule {}
