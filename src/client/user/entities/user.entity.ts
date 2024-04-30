import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../helpers/entities/baseEntity.entity';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TokenEntity } from '../../token/entities/token.entity';
import { MediaEntity } from '../../../media/entities/mediaEntity';
import { UserFavoritesEntity } from '../../../favorites/entities/favorites.entity';
import { BooksReadEntity } from './booksRead.entity';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @ApiProperty({
    title: 'User nickName',
    name: 'nickName',
    type: String,
    description: 'User nick name',
    required: true,
    example: 'David7',
  })
  @IsNotEmpty()
  @IsString()
  @Column({ type: 'varchar', nullable: false })
  nickName: string;

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
  @Column({ type: 'varchar', nullable: true, select: false })
  password: string;

  @ApiProperty({
    title: 'level',
    name: 'level',
    type: String,
    description: 'User level',
    required: true,
    example: '12',
  })
  @Column({ type: 'int', default: 1 })
  level?: number;

  @ApiProperty({
    title: 'Experience points required for level 2',
    name: 'expRequiredForLevel2',
    type: Number,
    description: 'Default experience points required to reach level 2',
    default: 200,
  })
  @Column({ type: 'int', default: 200 })
  expRequiredForNextLevel?: number;

  @ApiProperty({ title: 'Current User exp', name: 'currentExp' })
  @Column({ type: 'int', default: 200 })
  currentExp?: number;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    name: 'email',
    required: true,
    description: 'User email',
    example: 'dawut@gmail.com',
  })
  @Column({ type: 'varchar', nullable: false })
  email: string;

  @ApiProperty({
    name: 'verificationCode',
    required: true,
    description: 'User verification code',
    example: '12456',
  })
  @Column({ type: 'varchar', nullable: true })
  verificationCode?: string;

  @Column({ type: 'varchar', nullable: true })
  verificationCodeTime?: Date;

  @ApiProperty({
    title: 'Is user verified',
    description: 'User account is verified',
    name: 'isVerified',
  })
  @Column({ type: 'boolean', nullable: false, default: false })
  isVerified?: boolean;

  @OneToOne(() => TokenEntity, (token) => token.user)
  @JoinColumn()
  token?: TokenEntity;

  @OneToOne(() => MediaEntity, (media) => media.user)
  media?: MediaEntity;

  @OneToMany(() => UserFavoritesEntity, (favorites) => favorites.user)
  favorites?: UserFavoritesEntity[];

  @OneToMany(() => BooksReadEntity, (booksRead) => booksRead.user)
  booksRead?: BooksReadEntity[];
}
