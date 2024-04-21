import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/helpers/entities/baseEntity.entity';
import { CategoryEntity } from 'src/category/entities/category.entity';
import { LanguageEnum } from 'src/helpers/constants';
import { BooksEntity } from 'src/books/entities/books.entity';
import { DrawingsEntity } from 'src/drawings/entities/drawings.entity';
import { UserEntity } from 'src/client/user/entities/user.entity';

@Entity({ name: 'medias' })
export class MediaEntity extends BaseEntity {
  @ApiProperty({ description: 'File name', example: 'example.jpg' })
  @Column({ nullable: false })
  fileName: string;

  @ApiProperty({
    description: 'File path',
    example: '/path/to/file/example.jpg',
  })
  @Column({ nullable: false })
  filePath: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'image/jpeg' })
  @Column({ nullable: false })
  mimeType: string;

  @ApiProperty({ description: 'Size of the file in bytes', example: '1024' })
  @Column({ nullable: false })
  size: string;

  @ApiProperty({
    description: 'Original name of the file',
    example: 'example.jpg',
  })
  @Column({ nullable: false })
  originalName: string;

  @Column({ nullable: true, enum: LanguageEnum, type: 'enum' })
  mediaLng: LanguageEnum;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  bookId: string;

  @ManyToOne(() => CategoryEntity, (category) => category.medias, {
    onDelete: 'SET NULL',
  })
  category: CategoryEntity;

  @ManyToOne(() => BooksEntity, (book) => book.medias, {
    onDelete: 'SET NULL',
  })
  book: BooksEntity;

  @ManyToOne(() => DrawingsEntity, (drawing) => drawing.medias, {
    onDelete: 'SET NULL',
  })
  drawing: DrawingsEntity;

  @OneToOne(() => UserEntity, (user) => user.media, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
