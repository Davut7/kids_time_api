import { PickType } from '@nestjs/swagger';
import { AdminUserEntity } from '../entities/adminUser.entity';

export class CreateUserDto extends PickType(AdminUserEntity, [
  'name',
  'password',
] as const) {}
