import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { UserUpdateDto } from './dto/updateUser.dto';
import { hash } from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { UserTokenDto } from '../token/dto/token.dto';
import { AddExpDto } from './dto/addExp.dto';
import { ITransformedFile } from 'src/helpers/common/interfaces/fileTransform.interface';
import { unlink } from 'fs/promises';
import { MediaService } from 'src/media/media.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private dataSource: DataSource,
    private mediaService: MediaService,
  ) {}

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
      const hashedPassword = await hash(userUpdateDto.password, 10);
      userUpdateDto.password = hashedPassword;
    }
    Object.assign(user, userUpdateDto);

    await this.userRepository.save(user);
    return {
      message: 'User updated successfully!',
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async deleteUserById(currentUser: UserTokenDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    const user = await this.getMe(currentUser);
    try {
      await this.deleteUserImage(currentUser, queryRunner);
      await this.userRepository.softDelete(user.id);
      return {
        message: 'User deleted successfully!',
      };
    } catch (error) {
      queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      queryRunner.release();
    }
  }

  async getMe(currentUser: UserTokenDto) {
    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: { media: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email: email },
    });

    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  calculateRequiredXP(level: number): number {
    if (level === 1) {
      return 200;
    } else {
      return 200 * Math.pow(2, level - 2);
    }
  }

  async addExp(currentUser: UserTokenDto, dto: AddExpDto) {
    const user = await this.findUserById(currentUser.id);
    user.currentExp += dto.exp;

    const requiredLevelExp = this.calculateRequiredXP(user.level);

    if (user.currentExp >= requiredLevelExp) {
      user.level += 1;
      user.expRequiredForNextLevel = requiredLevelExp;
      user.currentExp -= requiredLevelExp;
    }

    await this.userRepository.save(user);

    return {
      message: 'Exp added to user exp',
      user: user,
    };
  }

  async uploadImage(image: ITransformedFile, currentUser: UserTokenDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    let uploadedFileId: string;
    try {
      await this.deleteUserImage(currentUser, queryRunner);
      const mediaId = await this.mediaService.createFileMedia(
        image,
        currentUser.id,
        queryRunner,
        'userId',
      );
      uploadedFileId = mediaId;
      await queryRunner.commitTransaction();
      return {
        message: 'User image uploaded successfully',
      };
    } catch (error) {
      queryRunner.rollbackTransaction();
      await unlink(image.filePath);
      await this.mediaService.deleteOneMedia(uploadedFileId, queryRunner);
      throw new InternalServerErrorException(error);
    } finally {
      queryRunner.release();
    }
  }

  async deleteUserImage(currentUser: UserTokenDto, queryRunner: QueryRunner) {
    const user = await this.getMe(currentUser);
    console.log(user);
    if (user.media) {
      await this.mediaService.deleteOneMedia(user.media.id, queryRunner);
    }
    return { message: 'User avatar not uploaded yet' };
  }
}
