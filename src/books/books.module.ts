import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '../media/media.module';
import { BooksEntity } from './entities/books.entity';
import { BooksAttributesEntity } from './entities/booksAttributes.entity';
import { CategoryEntity } from '../category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BooksEntity,
      BooksAttributesEntity,
      CategoryEntity,
    ]),
    MediaModule,
  ],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
