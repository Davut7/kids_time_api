import { AdminUserEntity } from 'src/admin/user/entities/adminUser.entity';

export class AdminTokenDto {
  id: string;
  name: string;

  constructor(entity: AdminUserEntity) {
    this.id = entity.id;
    this.name = entity.name;
  }
}
