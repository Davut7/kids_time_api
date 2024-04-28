import { PickType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PageOptionsDto } from '../../helpers/common/dto/page.dto';
import { LanguageEnum } from '../../helpers/constants/languageEnum';


export class UploadDrawingsDto extends PickType(PageOptionsDto, ['lng'] as const){
  @IsNotEmpty()
  @IsEnum(LanguageEnum)
  lng: LanguageEnum;
}
