import { PartialType } from '@nestjs/swagger';
import { AdminUserEntity } from '../entities/adminUser.entity';

export class UserUpdateDto extends PartialType(AdminUserEntity) {}
