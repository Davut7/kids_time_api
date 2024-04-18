import { Module } from '@nestjs/common';
import { AdminTokenService } from './token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminTokenEntity } from './entities/token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminTokenEntity])],
  providers: [AdminTokenService],
  exports: [AdminTokenService],
})
export class AdminTokenModule {}
