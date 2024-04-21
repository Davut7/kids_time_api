import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { TokenEntity } from './entities/token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TokenEntity])],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
