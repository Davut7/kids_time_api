import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne } from 'typeorm';
import { CategoryEntity } from './category.entity';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { BaseEntity } from '../../helpers/entities/baseEntity.entity';
import { LanguageEnum } from '../../helpers/constants/languageEnum';

@Entity({ name: 'category_attributes' })
export class CategoryAttributesEntity extends BaseEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The title of the category attribute' })
  @Column({ type: 'varchar', nullable: false })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The description of the category attribute' })
  @Column({ type: 'varchar', nullable: false })
  description: string;

  @IsNotEmpty()
  @IsEnum(LanguageEnum)
  @ApiProperty({
    description: 'The language of the category attribute',
    enum: LanguageEnum,
  })
  @Column({ type: 'enum', enum: LanguageEnum, nullable: false })
  language: LanguageEnum;

  @ApiProperty({
    description: 'The ID of the category to which this attribute belongs',
  })
  @Column({ type: 'uuid', nullable: false })
  categoryId: string;

  @ApiProperty({ description: 'The category to which this attribute belongs' })
  @ManyToOne(() => CategoryEntity, (category) => category.attributes, {
    onDelete: 'CASCADE',
  })
  category: CategoryEntity;
}
