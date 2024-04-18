import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../helpers/entities/baseEntity.entity';
import { AdminTokenEntity } from '../../token/entities/token.entity';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'admin_users' })
export class AdminUserEntity extends BaseEntity {
  @ApiProperty({
    title: 'name',
    name: 'name',
    type: String,
    description: 'User name',
    required: true,
    example: 'David',
  })
  @IsNotEmpty()
  @IsString()
  @Column({ type: 'text', nullable: false })
  name: string;

  @ApiProperty({
    title: 'password',
    name: 'password',
    type: String,
    description:
      'User password. /^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[@$!%*?&])[A-Za-zd@$!%*?&]{8,}$/',
    required: true,
    example: 'Test123!',
  })
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword()
  @Column({ type: 'varchar', nullable: false })
  password: string;

  @ApiProperty({ type: () => AdminTokenEntity })
  @OneToOne(() => AdminTokenEntity, (token) => token.user)
  @JoinColumn()
  token: AdminTokenEntity;
}
