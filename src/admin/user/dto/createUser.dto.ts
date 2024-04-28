import { PickType } from '@nestjs/swagger';
import { AdminUserEntity } from '../entities/adminUser.entity';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class CreateAdminUserDto extends PickType(AdminUserEntity, [
  'firstName',
] as const) {
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword()
  password: string;
}
