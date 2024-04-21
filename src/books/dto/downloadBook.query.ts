import { PickType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PageOptionsDto } from 'src/helpers/common/dto/page.dto';
import { LanguageEnum } from 'src/helpers/constants';

export class DownloadBookQuery extends PickType(PageOptionsDto, [
  'lng',
] as const) {
  @IsEnum(LanguageEnum)
  @IsNotEmpty()
  lng: LanguageEnum;
}
