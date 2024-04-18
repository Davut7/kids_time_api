import { Module } from '@nestjs/common';
import { AdminAuthService } from './auth.service';
import { AdminAuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from '../user/entities/adminUser.entity';
import { AdminTokenEntity } from '../token/entities/token.entity';
import { SharedModule } from 'src/shared/shared.module';
import { AdminTokenModule } from '../token/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUserEntity, AdminTokenEntity]),
    SharedModule,
    AdminTokenModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
})
export class AdminAuthModule {}
