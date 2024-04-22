import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BooksEntity } from './books.entity';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { BaseEntity } from '../../helpers/entities/baseEntity.entity';
import { LanguageEnum } from '../../helpers/constants/languageEnum';

@Entity({ name: 'books_attributes' })
export class BooksAttributesEntity extends BaseEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The title of the books attribute' })
  @Column({ type: 'varchar', nullable: false })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The description of the books attribute' })
  @Column({ type: 'varchar', nullable: false })
  description: string;

  @IsNotEmpty()
  @IsEnum(LanguageEnum)
  @ApiProperty({
    description: 'The language of the books attribute',
    enum: LanguageEnum,
  })
  @Column({ type: 'enum', enum: LanguageEnum, nullable: false })
  language: LanguageEnum;

  @ApiProperty({
    description: 'The ID of the books to which this attribute belongs',
  })
  @Column({ type: 'uuid', nullable: false })
  bookId: string;

  @ApiProperty({ description: 'The books to which this attribute belongs' })
  @ManyToOne(() => BooksEntity, (books) => books.attributes, {
    onDelete: 'CASCADE',
  })
  book: BooksEntity;
}
