import { PickType } from '@nestjs/swagger';
import { DrawingsEntity } from '../entities/drawings.entity';

export class CreateDrawingDto extends PickType(DrawingsEntity, [
  'requiredLevel',
] as const) {}
