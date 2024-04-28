import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { TokenEntity } from '../token/entities/token.entity';
import { TokenModule } from '../token/token.module';
import { RedisModule } from '../../redis/redis.module';
import { MediaModule } from '../../media/media.module';
import { MinioModule } from '../../minio/minio.module';
import { BooksReadEntity } from './entities/booksRead.entity';
import { BooksEntity } from '../../books/entities/books.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TokenEntity,
      BooksReadEntity,
      BooksEntity,
    ]),
    TokenModule,
    RedisModule,
    MediaModule,
    MinioModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
