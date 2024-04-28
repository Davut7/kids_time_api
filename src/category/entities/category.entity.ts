import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany } from 'typeorm';
import { CategoryAttributesEntity } from './categoryAttributes.entity';
import { CategoryTypeEnum } from '../../helpers/constants/categoryType.enum';
import { BooksEntity } from '../../books/entities/books.entity';
import { DrawingsEntity } from '../../drawings/entities/drawings.entity';
import { MediaEntity } from '../../media/entities/mediaEntity';
import { BaseEntity } from '../../helpers/entities/baseEntity.entity';

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

  @OneToMany(() => BooksEntity, (books) => books.category)
  books?: BooksEntity[];

  @OneToMany(() => DrawingsEntity, (drawings) => drawings.category)
  drawing?: DrawingsEntity[];

  @OneToMany(() => MediaEntity, (media) => media.category)
  medias?: MediaEntity[];

  @OneToMany(() => CategoryAttributesEntity, (attribute) => attribute.category)
  attributes?: CategoryAttributesEntity[];
}
