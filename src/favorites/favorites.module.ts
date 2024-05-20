import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFavoritesEntity } from './entities/favorites.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserFavoritesEntity])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
