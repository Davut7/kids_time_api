import { PickType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PageOptionsDto } from 'src/helpers/common/dto/page.dto';
import { LanguageEnum } from 'src/helpers/constants';

export class UploadDrawingsDto extends PickType(PageOptionsDto, ['lng'] as const){
  @IsNotEmpty()
  @IsEnum(LanguageEnum)
  lng: LanguageEnum;
}
