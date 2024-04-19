import { PickType } from '@nestjs/swagger';
import { AdminUserEntity } from 'src/admin/user/entities/adminUser.entity';

export class LoginDto extends PickType(AdminUserEntity, [
  'firstName',
  'password',
] as const) {}
