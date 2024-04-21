import { PartialType } from '@nestjs/swagger';
import { CreateBookAttributeDto } from './createBookAttribute.dto';

export class UpdateBookAttributeDto extends PartialType(
  CreateBookAttributeDto,
) {}
