import { PickType } from '@nestjs/swagger';
import { DrawingsAttributesEntity } from '../entities/drawingsAttributes.entity';

export class CreateDrawingsAttributeDto extends PickType(
  DrawingsAttributesEntity,
  ['language', 'title', 'description'] as const,
) {}
