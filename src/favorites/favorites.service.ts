import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavoritesEntity } from './entities/favorites.entity';
import { GetFavoritesQuery } from './dto/getFavorites.query';
import { UserTokenDto } from '../client/token/dto/token.dto';
import { FavoriteTypeEnum } from '../helpers/constants/favoriteType.enum';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(UserFavoritesEntity)
    private favoritesRepository: Repository<UserFavoritesEntity>,
  ) {}

  async getFavorites(currentUser: UserTokenDto, query: GetFavoritesQuery) {
    const { take = 10, page = 1 } = query;

    const favoritesQuery = this.favoritesRepository
      .createQueryBuilder('favorites')
      .where('favorites.userId = :userId', { userId: currentUser.id });

    if (query.favoriteType) {
      favoritesQuery
        .leftJoinAndSelect(
          `favorites.${query.favoriteType}`,
          `${query.favoriteType}`,
        )
        .leftJoinAndSelect(
          `${query.favoriteType}.medias`,
          `${query.favoriteType}Medias`,
        )
        .leftJoinAndSelect(
          `${query.favoriteType}.attributes`,
          `${query.favoriteType}Attributes`,
        );
      favoritesQuery.andWhere('favorites.favoriteType = :favoriteType', {
        favoriteType: query.favoriteType,
      });
    }

    const favorites = await favoritesQuery
      .take(take)
      .skip((page - 1) * take)
      .getManyAndCount();

    return favorites;
  }

  async addBookToFavorites(currentUser: UserTokenDto, bookId: string) {
    const book = await this.favoritesRepository.findOne({
      where: { userId: currentUser.id, bookId: bookId },
    });
    if (book) throw new NotFoundException('Book already in favorites');
    const favoriteBook = this.favoritesRepository.create({
      userId: currentUser.id,
      bookId: bookId,
      favoriteType: FavoriteTypeEnum.book,
    });

    await this.favoritesRepository.save(favoriteBook);

    return {
      message: 'Book added to favorites',
    };
  }

  async addDrawingToFavorites(currentUser: UserTokenDto, drawingId: string) {
    const drawing = await this.favoritesRepository.findOne({
      where: { userId: currentUser.id, drawingId: drawingId },
    });
    if (drawing) throw new NotFoundException('Drawing already in favorites');
    const favoriteDrawing = this.favoritesRepository.create({
      userId: currentUser.id,
      drawingId: drawingId,
      favoriteType: FavoriteTypeEnum.drawing,
    });

    await this.favoritesRepository.save(favoriteDrawing);

    return {
      message: 'Drawing added to favorites',
    };
  }

  async removeFromFavorites(currentUser: UserTokenDto, favoriteId: string) {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId: currentUser.id, id: favoriteId },
    });
    if (!favorite) throw new NotFoundException('Favorite not found');
    await this.favoritesRepository.delete(favorite.id);
    return {
      message: 'Favorite removed from favorites',
    };
  }
}
