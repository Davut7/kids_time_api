import { PickType } from '@nestjs/swagger';
import { PageOptionsDto } from '../../helpers/common/dto/page.dto';
import { CategoryTypeEnum } from '../../helpers/constants/categoryType.enum';


export class GetCategoriesQuery extends PickType(PageOptionsDto, [
  'q',
  'take',
  'page',
] as const) {
  categoryType: CategoryTypeEnum;
}
