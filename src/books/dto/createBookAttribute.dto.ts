import { PickType } from '@nestjs/swagger';
import { BooksAttributesEntity } from '../entities/booksAttributes.entity';

export class CreateBookAttributeDto extends PickType(BooksAttributesEntity, [
  'language',
  'title',
  'description',
] as const) {}
