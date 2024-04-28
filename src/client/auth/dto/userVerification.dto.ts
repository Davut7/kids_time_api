import { PickType } from '@nestjs/swagger';
import { UserEntity } from '../../user/entities/user.entity';


export class UserVerificationDto extends PickType(UserEntity, [
  'verificationCode',
] as const) {}
