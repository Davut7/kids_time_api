import { PickType } from '@nestjs/swagger';
import { PageOptionsDto } from '../../helpers/common/dto/page.dto';


export class GetDrawingsQuery extends PickType(PageOptionsDto, [
  'q',
  'take',
  'page',
  'lng'
] as const) {}
