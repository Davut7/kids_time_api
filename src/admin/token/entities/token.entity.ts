import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AdminUserEntity } from '../../user/entities/adminUser.entity';
import { BaseEntity } from '../../../helpers/entities/baseEntity.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'admin_tokens' })
export class AdminTokenEntity extends BaseEntity {
  @ApiProperty({ type: 'string', description: 'Users refresh token' })
  @Column({ type: 'text', nullable: false })
  refreshToken: string;

  @ApiProperty({ type: () => AdminUserEntity })
  @OneToOne(() => AdminUserEntity, (user) => user.token, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: AdminUserEntity;
}
