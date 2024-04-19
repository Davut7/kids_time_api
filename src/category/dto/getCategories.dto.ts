import { PickType } from '@nestjs/swagger';
import { PageOptionsDto } from 'src/helpers/common/dto/page.dto';
import { CategoryTypeEnum } from 'src/helpers/constants';

export class GetCategoriesQuery extends PickType(PageOptionsDto, [
  'q',
  'take',
  'page',
]) {
  categoryType: CategoryTypeEnum;
}
