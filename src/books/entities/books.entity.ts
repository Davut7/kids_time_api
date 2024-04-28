import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BooksAttributesEntity } from './booksAttributes.entity';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { BaseEntity } from '../../helpers/entities/baseEntity.entity';
import { CategoryEntity } from '../../category/entities/category.entity';
import { MediaEntity } from '../../media/entities/mediaEntity';
import { UserFavoritesEntity } from '../../favorites/entities/favorites.entity';
import { BooksReadEntity } from '../../client/user/entities/booksRead.entity';

@Entity({ name: 'books' })
@Index('IDX_BOOKS_CATEGORY_ID', ['categoryId'])
export class BooksEntity extends BaseEntity {
  @ApiProperty({
    title: 'Level to draw',
    name: 'title',
    nullable: false,
  })
  @IsInt()
  @IsNotEmpty()
  @Column({ type: 'int', nullable: false })
  requiredLevel: number;

  @ApiProperty({
    title: 'Book read time',
    name: 'readTime',
    nullable: false,
  })
  @IsNotEmpty()
  @IsString()
  @Column({ type: 'varchar', nullable: false })
  readTime: string;

  @Column({ type: 'uuid', nullable: false })
  categoryId: string;

  @ManyToOne(() => CategoryEntity, (category) => category.books)
  category: CategoryEntity;

  @OneToMany(() => MediaEntity, (media) => media.book)
  medias: MediaEntity[];

  @OneToMany(() => BooksAttributesEntity, (attribute) => attribute.book)
  attributes: BooksAttributesEntity[];

  @OneToMany(() => UserFavoritesEntity, (favorites) => favorites.book)
  favorites: UserFavoritesEntity[];

  @OneToMany(() => BooksReadEntity, (booksRead) => booksRead.book)
  readBy: BooksReadEntity[];
}
