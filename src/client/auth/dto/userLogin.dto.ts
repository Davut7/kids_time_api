import { PickType } from '@nestjs/swagger';
import { UserEntity } from 'src/client/user/entities/user.entity';

export class UserLoginDto extends PickType(UserEntity, [
  'password',
  'email',
] as const) {}
