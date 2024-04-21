import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/redis/redis.module';
import { UserEntity } from './entities/user.entity';
import { TokenEntity } from '../token/entities/token.entity';
import { TokenModule } from '../token/token.module';
import { MediaModule } from 'src/media/media.module';
import { MinioModule } from 'src/minio/minio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TokenEntity]),
    TokenModule,
    RedisModule,
    MediaModule,
    MinioModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
