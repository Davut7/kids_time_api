import { PartialType } from '@nestjs/swagger';
import { CreateCategoryAttributeDto } from './createCategoryAttribute.dto';

export class UpdateCategoryAttributeDto extends PartialType(
  CreateCategoryAttributeDto,
) {}
