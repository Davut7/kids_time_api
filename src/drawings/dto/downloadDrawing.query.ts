import { IsEnum, IsNotEmpty } from 'class-validator';
import { LanguageEnum } from '../../helpers/constants/languageEnum';
;

export class DownloadDrawingsQuery {
  @IsEnum(LanguageEnum)
  @IsNotEmpty()
  drawingLng: LanguageEnum;
}
