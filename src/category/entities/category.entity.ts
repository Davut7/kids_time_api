import { ApiProperty } from '@nestjs/swagger';
import { CategoryTypeEnum, LanguageEnum } from 'src/helpers/constants';
import { BaseEntity } from 'src/helpers/entities/baseEntity.entity';
import { MediaEntity } from 'src/media/entities/mediaEntity';
import { Column, Entity, OneToMany } from 'typeorm';
import { CategoryAttributesEntity } from './categoryAttributes.entity';

@Entity({ name: 'categories' })
export class CategoryEntity extends BaseEntity {
  @ApiProperty({
    title: 'Category type',
    name: 'categoryType',
    nullable: false,
  })
  @Column({ type: 'enum', enum: CategoryTypeEnum, nullable: false })
  categoryType: CategoryTypeEnum;

  @ApiProperty({
    title: 'Category title',
    name: 'title',
    nullable: false,
  })
  @Column({ type: 'varchar', nullable: false })
  title: string;

  @OneToMany(() => MediaEntity, (media) => media.category)
  medias: MediaEntity[];

  @OneToMany(() => CategoryAttributesEntity, (attribute) => attribute.category)
  attributes: CategoryAttributesEntity[];
}
