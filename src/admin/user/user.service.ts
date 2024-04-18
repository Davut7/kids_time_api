import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserUpdateDto } from './dto/updateUser.dto';
import { hash } from 'bcrypt';
import { CreateUserDto } from './dto/createUser.dto';
import { AdminUserEntity } from './entities/adminUser.entity';
import { AdminTokenDto } from '../token/dto/token.dto';
@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private userRepository: Repository<AdminUserEntity>,
  ) {}

  async isAdminUserExists(name: string) {
    const user = await this.userRepository.findOne({
      where: {
        name,
      },
    });
    if (!user) {
      return console.log('Default admin user not found');
    }
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { name: dto.name },
    });

    if (existingUser)
      throw new ConflictException(`User with name ${dto.name} already exists!`);

    const hashedPassword = await hash(dto.password, 10);
    dto.password = hashedPassword;
    const user = this.userRepository.create(dto);

    await this.userRepository.save(user);

    return {
      message: 'User created successful!',
    };
  }

  async getAllUsers() {
    const [users, count] = await this.userRepository.findAndCount({
      select: ['id', 'name', 'updatedAt', 'updatedAt'],
    });

    return {
      message: 'User returned successfully',
      users: users,
      usersCount: count,
    };
  }

  async findUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'createdAt', 'updatedAt'],
    });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return user;
  }

  async updateUserById(userId: string, userUpdateDto: UserUpdateDto) {
    const user = await this.findUserById(userId);
    if (userUpdateDto.password) {
      const hashedPassword = await hash(userUpdateDto.password, 10);
      userUpdateDto.password = hashedPassword;
    }
    Object.assign(user, userUpdateDto);

    await this.userRepository.save(user);
    return {
      message: 'User updated successfully!',
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async deleteUserById(userId: string) {
    const user = await this.findUserById(userId);

    await this.userRepository.delete(user.id);
    return {
      message: 'User deleted successfully!',
    };
  }

  async getMe(currentUser: AdminTokenDto) {
    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
    });

    return user;
  }
}
