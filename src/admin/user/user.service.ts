import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserUpdateDto } from './dto/updateUser.dto';
import { CreateAdminUserDto } from './dto/createUser.dto';
import { AdminUserEntity } from './entities/adminUser.entity';
import { AdminTokenDto } from '../token/dto/token.dto';
import { GetUsersQuery } from './dto/getUsers.query';
import { generateHash } from '../../helpers/providers/generateHash';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private userRepository: Repository<AdminUserEntity>,
  ) {}

  async isAdminUserExists() {
    const user = await this.userRepository.find();
    return user;
  }

  async createUser(dto: CreateAdminUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { firstName: dto.firstName },
    });
    if (existingUser)
      throw new ConflictException(
        `User with firstName ${dto.firstName} already exists!`,
      );

    const hashedPassword = await generateHash(dto.password);
    dto.password = hashedPassword;
    const user = this.userRepository.create(dto);

    await this.userRepository.save(user);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
      },
      message: 'User created successfully!',
    };
  }

  async getAllUsers(query?: GetUsersQuery) {
    const { take = 10, page = 1, q = '' } = query;

    const [users, count] = await this.userRepository
      .createQueryBuilder('users')
      .take(take)
      .skip((page - 1) * take)
      .where('users.firstName ILIKE :q ', { q: `%${q}%` })
      .getManyAndCount();

    return {
      message: 'User returned successfully',
      users: users,
      usersCount: count,
    };
  }

  async findUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return user;
  }

  async updateUserById(userId: string, userUpdateDto: UserUpdateDto) {
    const user = await this.findUserById(userId);

    if (userUpdateDto.password) {
      const hashedPassword = await generateHash(userUpdateDto.password);
      userUpdateDto.password = hashedPassword;
    }
    user.firstName = userUpdateDto.firstName;
    await this.userRepository.save(user);

    return {
      message: 'User updated successfully!',
      id: user.id,
      firstName: user.firstName,
    };
  }

  async deleteUserById(currentUserId: string, userId: string) {
    if (currentUserId === userId)
      throw new BadRequestException('You cannot delete yourself!');
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
    if (!user)
      throw new NotFoundException('User not found, maybe account deleted');
    return new AdminTokenDto(user);
  }
}
