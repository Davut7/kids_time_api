import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '../media/media.module';
import { SharedModule } from 'src/shared/shared.module';
import { AdminTokenModule } from 'src/admin/token/token.module';
import { BooksEntity } from './entities/books.entity';
import { BooksAttributesEntity } from './entities/booksAttributes.entity';
import { CategoryEntity } from 'src/category/entities/category.entity';
import { TokenModule } from 'src/client/token/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BooksEntity,
      BooksAttributesEntity,
      CategoryEntity,
    ]),
    MediaModule,
    SharedModule,
    AdminTokenModule,
    TokenModule,
  ],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
