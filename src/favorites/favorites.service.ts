import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavoritesEntity } from './entities/favorites.entity';
import { UserTokenDto } from 'src/client/token/dto/token.dto';
import { GetFavoritesQuery } from './dto/getFavorites.query';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(UserFavoritesEntity)
    private favoritesRepository: Repository<UserFavoritesEntity>,
  ) {}

  async getFavorites(currentUser: UserTokenDto, query: GetFavoritesQuery) {
    const { take = 10, page = 1 } = query;

    const favorites = await this.favoritesRepository
      .createQueryBuilder('favorites')
      .leftJoinAndSelect('favorites.book', 'book')
      .leftJoinAndSelect('favorites.drawing', 'drawing')
      .leftJoinAndSelect('drawing.medias', 'drawingMedias')
      .leftJoinAndSelect('drawing.attributes', 'drawingAttributes')
      .leftJoinAndSelect('book.medias', 'bookMedias')
      .leftJoinAndSelect('book.attributes', 'bookAttributes')
      .where('favorites.userId = :userId', { userId: currentUser.id })
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
    const favoriteBook = this.favoritesRepository.create({
      userId: currentUser.id,
      drawingId: drawingId,
    });

    await this.favoritesRepository.save(favoriteBook);

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
