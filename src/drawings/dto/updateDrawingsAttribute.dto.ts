import { PartialType } from '@nestjs/swagger';
import { CreateDrawingsAttributeDto } from './createDrawingAttribute.dto';

export class UpdateDrawingsAttributeDto extends PartialType(
  CreateDrawingsAttributeDto,
) {}
