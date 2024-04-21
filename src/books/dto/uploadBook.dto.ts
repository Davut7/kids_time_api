import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PageOptionsDto } from 'src/helpers/common/dto/page.dto';
import { LanguageEnum } from 'src/helpers/constants';

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
