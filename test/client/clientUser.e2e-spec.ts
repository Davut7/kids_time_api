import { CreateBookDto } from './../../src/books/dto/createBook.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as cookieParser from 'cookie-parser';
import { UserEntity } from '../../src/client/user/entities/user.entity';
import { UserTokenDto } from '../../src/client/token/dto/token.dto';
import * as jwt from 'jsonwebtoken';
import { AddExpDto } from '../../src/client/user/dto/addExp.dto';
import { BooksEntity } from '../../src/books/entities/books.entity';
import { CategoryEntity } from '../../src/category/entities/category.entity';
import { CreateCategoryDto } from '../../src/category/dto/createCategory.dto';
import { CategoryTypeEnum } from '../../src/helpers/constants/categoryType.enum';

describe('ClientUserController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let bookRepository: Repository<BooksEntity>;
  let categoryRepository: Repository<CategoryEntity>;

  let user: UserEntity;
  let category: CategoryEntity;
  let book: BooksEntity;

  let wrongId: string = 'e5001bd4-a01b-4b12-97fa-ec804a7a2e53';

  let userForRegister: UserEntity = {
    id: '',
    email: 'test@gmail.com',
    nickName: 'David123',
    password: 'David123!',
  };

  let wrongUser: UserEntity = {
    id: 'e5001bd4-a01b-4b12-97fa-ec804a7a2e53',
    email: 'test@gmail.com',
    nickName: 'David123',
    password: 'David123!',
    isVerified: true,
  };

  let createBookDto: CreateBookDto = {
    readTime: '10',
    requiredLevel: 1,
  };

  let createCategoryDto: CreateCategoryDto = {
    title: '1234',
    categoryType: CategoryTypeEnum.books,
  };

  let userExpDto: AddExpDto = {
    exp: 100,
  };

  let token: string;
  let invalidToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, Redis],
      providers: [
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BooksEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useClass: Repository,
        },
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    bookRepository = moduleFixture.get(getRepositoryToken(BooksEntity));
    categoryRepository = moduleFixture.get(getRepositoryToken(CategoryEntity));
    user = await registerCorrectUser(userForRegister, userRepository);
    let correctUserTokenDto = new UserTokenDto(user);
    let wrongUserTokenDto = new UserTokenDto(wrongUser);
    category = await createCategory(createCategoryDto, categoryRepository);
    book = await createBook(createBookDto, category.id, bookRepository);
    token = jwt.sign(
      { ...correctUserTokenDto },
      process.env.JWT_CLIENT_ACCESS_SECRET,
      { expiresIn: '3h' },
    );
    invalidToken = jwt.sign(
      { ...wrongUserTokenDto },
      process.env.JWT_CLIENT_ACCESS_SECRET,
      { expiresIn: '3h' },
    );
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    // await cleanupTestData(userRepository, bookRepository, categoryRepository);
    const redis = app.get(Redis);
    redis.disconnect();
    await app.close();
  });

  describe('Get current user GET /users/get-me', () => {
    it('should return current user GET /users/get-me', async () => {
      await request(app.getHttpServer())
        .get('/users/get-me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
        });
    });

    it('should throw not found exception if user not found GET /users/get-me', async () => {
      await request(app.getHttpServer())
        .get('/users/get-me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('User not found!');
        });
    });
  });

  describe('Add experience points to user PATCH /users/add-exp', () => {
    it('should add experience to current user PATCH /users/add-exp', async () => {
      await request(app.getHttpServer())
        .patch('/users/add-exp')
        .set('Authorization', `Bearer ${token}`)
        .send(userExpDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.message).toEqual('Exp added to user exp');
        });
    });

    it('should throw not found exception if user not found PATCH /users/add-exp', async () => {
      await request(app.getHttpServer())
        .patch('/users/add-exp')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(userExpDto)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('User not found!');
        });
    });
  });

  describe('Update user data PATCH /users', () => {
    it('should update current user PATCH /users', async () => {
      await request(app.getHttpServer())
        .patch('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.message).toEqual('User updated successfully.');
        });
    });

    it('should throw not found exception if user not found PATCH /users', async () => {
      await request(app.getHttpServer())
        .patch('/users')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('User not found!');
        });
    });
  });

  describe('Delete user data DELETE /users', () => {
    it('should update current user DELETE /users', async () => {
      await request(app.getHttpServer())
        .delete('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('User deleted successfully.');
        });
    });

    it('should throw not found exception if user not found DELETE /users', async () => {
      await request(app.getHttpServer())
        .delete('/users')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('User not found!');
        });
    });
  });

  describe('Add book to read list POST /users/read-list/:bookId', () => {
    it('should add book to read list POST /users/read-list/:bookId', async () => {
      console.log(book);
      await request(app.getHttpServer())
        .post(`/users/read-list/${book.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect((res) => {
          console.log(res.body.message);
          expect(res.body.message).toEqual(
            'Book added to read list successfully.',
          );
        });
    });

    it('should throw not found exception if user not found POST /users/read-list/:bookId', async () => {
      await request(app.getHttpServer())
        .post(`/users/read-list/${book.id}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('User not found!');
        });
    });

    it('should throw not found error if book not found POST /users/read-list/:bookId', async () => {
      await request(app.getHttpServer())
        .post(`/users/read-list/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('User not found!');
        });
    });

    it('should add book to read list POST /users/read-list/:bookId', async () => {
      await request(app.getHttpServer())
        .post(`/users/read-list/${book.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toEqual('You already read this book!');
        });
    });
  });
});

async function cleanupTestData(
  userRepository: Repository<UserEntity>,
  bookRepository: Repository<BooksEntity>,
  categoryRepository: Repository<CategoryEntity>,
) {
  try {
    await bookRepository.delete({});
    await userRepository.delete({});
    await categoryRepository.delete({});
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

async function registerCorrectUser(
  dto: UserEntity,
  userRepository: Repository<UserEntity>,
) {
  const user = userRepository.create({
    nickName: dto.nickName,
    email: dto.email,
    password: dto.password,
    isVerified: true,
  });

  await userRepository.save(user);

  return user;
}

async function createBook(
  dto: CreateBookDto,
  categoryId: string,
  bookRepository: Repository<BooksEntity>,
) {
  const book = bookRepository.create({ ...dto, categoryId: categoryId });
  await bookRepository.save(book);
  return book;
}

async function createCategory(
  createCategoryDto: CreateCategoryDto,
  categoryRepository: Repository<CategoryEntity>,
) {
  const category = categoryRepository.create(createCategoryDto);

  await categoryRepository.save(category);
  return category;
}
