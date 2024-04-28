import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFavoritesEntity } from './entities/favorites.entity';
import { RedisModule } from '../redis/redis.module';
import { TokenModule } from '../client/token/token.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserFavoritesEntity]),
    RedisModule,
    TokenModule,
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
