import {
  ConflictException,
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
import { unlink } from 'fs/promises';
import { ITransformedFile } from '../../helpers/common/interfaces/fileTransform.interface';
import { MediaService } from '../../media/media.service';
import { BooksReadEntity } from './entities/booksRead.entity';
import { BooksEntity } from '../../books/entities/books.entity';
import { GetReadBooksDto } from './dto/getReadBooks.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BooksReadEntity)
    private booksReadRepository: Repository<BooksReadEntity>,
    @InjectRepository(BooksEntity)
    private booksRepository: Repository<BooksEntity>,
    private dataSource: DataSource,
    private mediaService: MediaService,
  ) {}

  async findUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { media: true },
    });
    if (!user) throw new NotFoundException(`User not found!`);
    return user;
  }

  async updateUser(currentUser: UserTokenDto, userUpdateDto: UserUpdateDto) {
    const user = await this.findUserById(currentUser.id);
    if (userUpdateDto.password) {
      const hashedPassword = await hash(userUpdateDto.password, 10);
      userUpdateDto.password = hashedPassword;
    }
    Object.assign(user, userUpdateDto);

    await this.userRepository.save(user);
    return {
      message: 'User updated successfully.',
      user,
    };
  }

  async deleteUser(currentUser: UserTokenDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    const user = await this.findUserById(currentUser.id);
    try {
      await this.deleteUserImage(currentUser, queryRunner);
      await this.userRepository.softDelete(user.id);
      return {
        message: 'User deleted successfully.',
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
    if (!user) throw new NotFoundException('User not found!');
    return { user };
  }

  async findOneByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email: email },
      select: [
        'id',
        'email',
        'nickName',
        'password',
        'isVerified',
        'level',
        'expRequiredForNextLevel',
        'currentExp',
      ],
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
      user,
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
    const user = await this.findUserById(currentUser.id);
    if (user.media) {
      await this.mediaService.deleteOneMedia(user.media.id, queryRunner);
    }
    return { message: 'User avatar not uploaded yet' };
  }

  async addBookToReadList(currentUser: UserTokenDto, bookId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    const user = await this.findUserById(currentUser.id);
    const book = await this.booksRepository.findOne({
      where: { id: bookId },
    });
    if (!book) throw new NotFoundException('Book not found!');
    const readBook = await this.booksReadRepository.findOne({
      where: { bookId: bookId, userId: user.id },
    });
    if (readBook) throw new ConflictException('You already read this book!');
    try {
      const bookRead = this.booksReadRepository.create({
        userId: user.id,
        bookId: bookId,
      });
      await this.booksReadRepository.save(bookRead);
      await queryRunner.commitTransaction();
      return {
        message: 'Book added to read list',
      };
    } catch (error) {
      queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      queryRunner.release();
    }
  }

  async userReadBooks(currentUser: UserTokenDto, query: GetReadBooksDto) {
    const { page = 1, take = 10, q = '' } = query;
    const user = await this.findUserById(currentUser.id);
    const booksQuery = this.booksReadRepository
      .createQueryBuilder('readBooks')
      .leftJoinAndSelect('readBooks.book', 'books')
      .leftJoinAndSelect('books.medias', 'medias')
      .leftJoinAndSelect('books.attributes', 'attributes')
      .where('readBooks.userId = :userId', { userId: user.id });

    if (query.lng) {
      booksQuery.andWhere('attributes.language = :lng', { lng: query.lng });
    }
    
    if (q) {
      booksQuery.andWhere('books.title LIKE :q', { q: `%${q}%` });
    }

    const [books, booksCount] = await booksQuery
      .take(take)
      .skip((page - 1) * take)
      .getManyAndCount();
    return {
      books: books,
      booksCount: booksCount,
    };
  }
}
