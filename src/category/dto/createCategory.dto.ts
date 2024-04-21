import { PickType } from '@nestjs/swagger';
import { CategoryEntity } from '../entities/category.entity';

export class CreateCategoryDto extends PickType(CategoryEntity, [
  'categoryType',
  'title',
] as const) {}
