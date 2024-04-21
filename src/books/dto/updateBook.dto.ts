import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './createBook.dto';

export class UpdateBookDto extends PartialType(CreateBookDto) {}
