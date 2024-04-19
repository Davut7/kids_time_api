import { PickType } from '@nestjs/swagger';
import { CategoryAttributesEntity } from '../entities/categoryAttributes.entity';

export class CreateCategoryAttributeDto extends PickType(
  CategoryAttributesEntity,
  ['language', 'title', 'description'],
) {}
