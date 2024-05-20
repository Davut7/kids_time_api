import { Module } from '@nestjs/common';
import { AdminUserService } from './user.service';
import { AdminUserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from './entities/adminUser.entity';
import { AdminTokenEntity } from '../token/entities/token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUserEntity, AdminTokenEntity])],
  controllers: [AdminUserController],
  providers: [AdminUserService],
  exports: [AdminUserService],
})
export class AdminUserModule {}
