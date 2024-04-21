import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/helpers/entities/baseEntity.entity';
import { MediaEntity } from 'src/media/entities/mediaEntity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BooksAttributesEntity } from './booksAttributes.entity';
import { CategoryEntity } from 'src/category/entities/category.entity';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { UserFavoritesEntity } from 'src/favorites/entities/favorites.entity';

@Entity({ name: 'books' })
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
}
