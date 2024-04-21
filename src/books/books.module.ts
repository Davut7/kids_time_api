import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '../media/media.module';
import { AdminTokenModule } from 'src/admin/token/token.module';
import { BooksEntity } from './entities/books.entity';
import { BooksAttributesEntity } from './entities/booksAttributes.entity';
import { CategoryEntity } from 'src/category/entities/category.entity';
import { TokenModule } from 'src/client/token/token.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BooksEntity,
      BooksAttributesEntity,
      CategoryEntity,
    ]),
    RedisModule,
    MediaModule,
    AdminTokenModule,
    TokenModule,
  ],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
