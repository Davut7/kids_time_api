import { PickType } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../helpers/common/dto/page.dto';

export class GetUsersQuery extends PickType(PageOptionsDto, [
  'take',
  'page',
  'q',
] as const) {}
