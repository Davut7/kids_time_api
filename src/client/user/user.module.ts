import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { TokenEntity } from '../token/entities/token.entity';
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
    MediaModule,
    MinioModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
