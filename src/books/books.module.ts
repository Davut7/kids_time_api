import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '../media/media.module';
import { BooksEntity } from './entities/books.entity';
import { BooksAttributesEntity } from './entities/booksAttributes.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { RedisModule } from '../redis/redis.module';
import { AdminTokenModule } from '../admin/token/token.module';
import { TokenModule } from '../client/token/token.module';


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
