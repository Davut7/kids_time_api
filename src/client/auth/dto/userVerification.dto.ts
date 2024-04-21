import { PickType } from '@nestjs/swagger';
import { UserEntity } from 'src/client/user/entities/user.entity';

export class UserVerificationDto extends PickType(UserEntity, [
  'verificationCode',
] as const) {}
