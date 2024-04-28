import { PartialType } from '@nestjs/swagger';
import { CreateAdminUserDto } from './createUser.dto';

export class UserUpdateDto extends PartialType(CreateAdminUserDto) {}
