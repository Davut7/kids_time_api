import { PickType } from '@nestjs/swagger';
import { BooksEntity } from '../entities/books.entity';

export class CreateBookDto extends PickType(BooksEntity, [
  'requiredLevel',
  'readTime',
] as const) {}
