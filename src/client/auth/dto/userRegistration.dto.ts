import { PickType } from '@nestjs/swagger';
import { UserEntity } from 'src/client/user/entities/user.entity';

export class UserRegistrationDto extends PickType(UserEntity, [
  'password',
  'email',
  'nickName',
] as const) {}
