import { IsEnum, IsNotEmpty } from 'class-validator';
import { LanguageEnum } from 'src/helpers/constants';

export class DownloadDrawingsQuery {
  @IsEnum(LanguageEnum)
  @IsNotEmpty()
  drawingLng: LanguageEnum;
}
