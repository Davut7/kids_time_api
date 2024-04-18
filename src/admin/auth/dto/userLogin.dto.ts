import { OmitType } from '@nestjs/swagger';
import { AdminUserEntity } from 'src/admin/user/entities/adminUser.entity';

export class LoginDto extends OmitType(AdminUserEntity, ['token'] as const) {}
