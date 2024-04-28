import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { LanguageEnum } from '../../helpers/constants/languageEnum';
import { PageOptionsDto } from '../../helpers/common/dto/page.dto';


export class UploadBookDto extends PickType(PageOptionsDto, ['lng'] as const) {
  @ApiProperty({
    name: 'bookLanguage',
    title: 'Book language',
    description: 'Book language',
  })
  @IsNotEmpty()
  @IsEnum(LanguageEnum)
  lng: LanguageEnum;
}
