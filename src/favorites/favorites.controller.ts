import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { UserTokenDto } from 'src/client/token/dto/token.dto';
import { GetFavoritesQuery } from './dto/getFavorites.query';
import { UserAuthGuard } from 'src/helpers/guards/userAuth.guard';
import { CurrentUser } from 'src/helpers/common/decorators/currentUser.decorator';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(UserAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOkResponse({ description: 'Get user favorites' })
  @ApiQuery({
    name: 'take',
    description: 'Number of items to take',
    required: false,
  })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  async getFavorites(
    @Query() query: GetFavoritesQuery,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.favoritesService.getFavorites(currentUser, query);
  }

  @Post('book/:bookId')
  @ApiOkResponse({ description: 'Book added to favorites' })
  @ApiParam({ name: 'bookId', description: 'Book ID' })
  async addBookToFavorites(
    @Param('bookId') bookId: string,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.favoritesService.addBookToFavorites(currentUser, bookId);
  }

  @Post('drawing/:drawingId')
  @ApiOkResponse({ description: 'Drawing added to favorites' })
  @ApiParam({ name: 'drawingId', description: 'Drawing ID' })
  async addDrawingToFavorites(
    @Param('drawingId') drawingId: string,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.favoritesService.addDrawingToFavorites(currentUser, drawingId);
  }

  @Delete(':favoriteId')
  @ApiOkResponse({ description: 'Favorite removed from favorites' })
  @ApiParam({ name: 'favoriteId', description: 'Favorite ID' })
  async removeFromFavorites(
    @Param('favoriteId') favoriteId: string,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.favoritesService.removeFromFavorites(currentUser, favoriteId);
  }
}
