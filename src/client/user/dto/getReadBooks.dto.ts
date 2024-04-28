import { PickType } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../helpers/common/dto/page.dto';

export class GetReadBooksDto extends PickType(PageOptionsDto, [
  'order',
  'page',
  'take',
  'q',
  'lng',
]) {}
