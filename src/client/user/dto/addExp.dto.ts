import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AddExpDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ name: 'exp', description: 'How much user exp earned' })
  exp: number;
}
