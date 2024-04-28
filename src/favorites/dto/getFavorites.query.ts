import { PickType } from '@nestjs/swagger';
import { PageOptionsDto } from '../../helpers/common/dto/page.dto';
import { FavoriteTypeEnum } from '../../helpers/constants/favoriteType.enum';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class GetFavoritesQuery extends PickType(PageOptionsDto, [
  'page',
  'take',
] as const) {
  @IsNotEmpty()
  @IsEnum(FavoriteTypeEnum)
  favoriteType: FavoriteTypeEnum;
}
