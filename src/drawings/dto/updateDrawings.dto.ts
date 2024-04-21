import { PartialType } from '@nestjs/swagger';
import { CreateDrawingDto } from './createDrawing.dto';


export class UpdateDrawingsDto extends PartialType(CreateDrawingDto) {}
