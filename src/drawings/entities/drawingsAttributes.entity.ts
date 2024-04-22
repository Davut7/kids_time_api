import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne } from 'typeorm';
import { DrawingsEntity } from './drawings.entity';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { LanguageEnum } from '../../helpers/constants/languageEnum';
import { BaseEntity } from '../../helpers/entities/baseEntity.entity';

@Entity({ name: 'drawings_attributes' })
export class DrawingsAttributesEntity extends BaseEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The title of the drawings attribute' })
  @Column({ type: 'varchar', nullable: false })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The description of the drawings attribute' })
  @Column({ type: 'varchar', nullable: false })
  description: string;

  @IsNotEmpty()
  @IsEnum(LanguageEnum)
  @ApiProperty({
    description: 'The language of the drawings attribute',
    enum: LanguageEnum,
  })
  @Column({ type: 'enum', enum: LanguageEnum, nullable: false })
  language: LanguageEnum;

  @ApiProperty({
    description: 'The ID of the drawings to which this attribute belongs',
  })
  @Column({ type: 'uuid', nullable: false })
  drawingId: string;

  @ApiProperty({ description: 'The drawings to which this attribute belongs' })
  @ManyToOne(() => DrawingsEntity, (drawings) => drawings.attributes)
  drawing: DrawingsEntity;
}
