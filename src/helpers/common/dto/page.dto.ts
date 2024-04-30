import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../../constants/orderEnum';
import { LanguageEnum } from '../../constants/languageEnum';

export class PageOptionsDto {
  @ApiProperty({
    enum: OrderType,
    default: OrderType.ASC,
    description: 'Sorting order (ASC or DESC)',
    required: false,
  })
  @IsEnum(OrderType)
  @IsOptional()
  @Type(() => String)
  readonly order: OrderType = OrderType.ASC;

  @ApiProperty({
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  readonly page?: number;

  @ApiProperty({
    type: Number,
    minimum: 1,
    enum: [5, 10, 20, 50],
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsIn([5, 10, 20, 50])
  @IsOptional()
  @Type(() => Number)
  readonly take?: number;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly q?: string;

  @ApiProperty({
    enum: LanguageEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(LanguageEnum)
  readonly lng: LanguageEnum;
}
