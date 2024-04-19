import { AdminUserEntity } from 'src/admin/user/entities/adminUser.entity';

export class AdminTokenDto {
  id: string;
  firstName: string;

  constructor(entity: AdminUserEntity) {
    this.id = entity.id;
    this.firstName = entity.firstName;
  }
}
