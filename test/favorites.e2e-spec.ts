import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../src/category/entities/category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as path from 'path';
import { CreateCategoryDto } from '../src/category/dto/createCategory.dto';
import { CategoryTypeEnum } from '../src/helpers/constants/categoryType.enum';
import * as jwt from 'jsonwebtoken';
import { BooksEntity } from '../src/books/entities/books.entity';
import { UserEntity } from '../src/client/user/entities/user.entity';
import { UserRegistrationDto } from '../src/client/auth/dto/userRegistration.dto';
import { CreateBookDto } from '../src/books/dto/createBook.dto';
import { UpdateBookDto } from '../src/books/dto/updateBook.dto';
import { UserTokenDto } from '../src/client/token/dto/token.dto';
import { LanguageEnum } from '../src/helpers/constants/languageEnum';
import { BooksAttributesEntity } from '../src/books/entities/booksAttributes.entity';
import { CreateBookAttributeDto } from '../src/books/dto/createBookAttribute.dto';
import { AdminUserEntity } from '../src/admin/user/entities/adminUser.entity';
import { CreateAdminUserDto } from '../src/admin/user/dto/createUser.dto';
import { AdminTokenDto } from '../src/admin/token/dto/token.dto';
import { MediaEntity } from '../src/media/entities/mediaEntity';
import { DownloadBookQuery } from '../src/books/dto/downloadBook.query';

describe('FavoritesController Endpoints', () => {
  let app: INestApplication;
  let categoryRepository: Repository<CategoryEntity>;
  let booksRepository: Repository<BooksEntity>;
  let userRepository: Repository<UserEntity>;
  let bookAttributeRepository: Repository<BooksAttributesEntity>;
  let adminUserRepository: Repository<AdminUserEntity>;
  let category: CategoryEntity;
  let book: BooksEntity;
  let highLevelUser: UserEntity;
  let lowLevelUser: UserEntity;
  let token: string;
  let adminToken: string;
  let invalidToken: string;
  let bookAttribute: BooksAttributesEntity;
  let adminUser: AdminUserEntity;

  let createHighLevelUserDto: UserRegistrationDto = {
    email: 'test@gmail.com',
    nickName: 'David123',
    password: 'Test123!',
  };

  let createLowLevelUserDto: UserRegistrationDto = {
    email: 'test123@gmail.com',
    nickName: 'Test123',
    password: 'Test123!',
  };

  let createCategoryDto: CreateCategoryDto = {
    title: 'Books category',
    categoryType: CategoryTypeEnum.books,
  };

  let createBookDto: CreateBookDto = {
    readTime: '10',
    requiredLevel: 5,
  };

  let updateBookDto: UpdateBookDto = {
    readTime: '10',
    requiredLevel: 5,
  };

  let createBookAttributeDtoMethod: CreateBookAttributeDto = {
    language: LanguageEnum.en,
    description: 'Good book',
    title: 'Title',
  };

  let createBookAttribute: CreateBookAttributeDto = {
    language: LanguageEnum.hi,
    description: 'Good book',
    title: 'Best book',
  };

  let createAdminUserDto: CreateAdminUserDto = {
    firstName: 'Admin',
    password: 'Admin123!',
  };

  let validDownloadBookQuery: DownloadBookQuery = {
    lng: LanguageEnum.en,
  };

  let invalidDownloadBookQuery: DownloadBookQuery = {
    lng: LanguageEnum.ru,
  };

  const wrongId = 'e5001bd4-a01b-4b12-97fa-ec804a7a2e53';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: getRepositoryToken(CategoryEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BooksEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BooksAttributesEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(AdminUserEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    categoryRepository = moduleFixture.get(getRepositoryToken(CategoryEntity));
    booksRepository = moduleFixture.get(getRepositoryToken(BooksEntity));
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    bookAttributeRepository = moduleFixture.get(
      getRepositoryToken(BooksAttributesEntity),
    );
    adminUserRepository = moduleFixture.get(
      getRepositoryToken(AdminUserEntity),
    );
    category = await createCategory(categoryRepository, createCategoryDto);
    book = await createBook(booksRepository, createBookDto, category.id);
    bookAttribute = await createOneBookAttribute(
      bookAttributeRepository,
      createBookAttribute,
      book.id,
    );
    adminUser = await createAdminUser(adminUserRepository, createAdminUserDto);
    lowLevelUser = await createLowLevelUser(
      userRepository,
      createLowLevelUserDto,
    );
    highLevelUser = await createHighLevelUser(
      userRepository,
      createHighLevelUserDto,
    );
    const highLevelUserDto = new UserTokenDto(highLevelUser);
    const adminUserTokenDto = new AdminTokenDto(adminUser);
    const lowLevelUserDto = new UserTokenDto(lowLevelUser);
    token = jwt.sign(
      { ...highLevelUserDto },
      process.env.JWT_CLIENT_ACCESS_SECRET,
      {
        expiresIn: '30d',
      },
    );

    adminToken = jwt.sign(
      { ...adminUserTokenDto },
      process.env.JWT_ADMIN_ACCESS_SECRET,
      {
        expiresIn: '30d',
      },
    );

    invalidToken = jwt.sign(
      { ...lowLevelUserDto },
      process.env.JWT_CLIENT_ACCESS_SECRET,
      {
        expiresIn: '30d',
      },
    );
    await app.init();
  });

  afterAll(async () => {
    await cleanupTestData(
      categoryRepository,
      booksRepository,
      userRepository,
      adminUserRepository,
    );
    await app.close();
  });

  describe('Create Book POST /books', () => {
    it('should create book', () => {
      return request(app.getHttpServer())
        .post(`/books/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBookDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual('Book created successfully.');
          expect(res.body.book).toBeDefined();
        });
    });
    it('should throw not found exception if category not found', () => {
      return request(app.getHttpServer())
        .post(`/books/${wrongId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBookDto)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Category not found!');
        });
    });
  });

  describe('Get All Books GET /books', () => {
    it('should return all books', () => {
      return request(app.getHttpServer())
        .get('/books')
        .expect(200)
        .expect((res) => {
          expect(res.body.books).toBeDefined();
          expect(res.body.booksCount).toBeGreaterThan(0);
        });
    });
  });

  describe('Get One Book by Id GET /books/:bookId', () => {
    it('should return one book by id', () => {
      return request(app.getHttpServer())
        .get(`/books/${book.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
    it('should throw Notfound exception if book not exists', () => {
      return request(app.getHttpServer())
        .get(`/books/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Book not found!');
        });
    });

    it('should throw Forbidden exception if level lower than required', () => {
      return request(app.getHttpServer())
        .get(`/books/${book.id}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Your level is lower than required!',
          );
        });
    });
  });

  describe('Update Book PATCH /books/:bookId', () => {
    it('should update book', async () => {
      return request(app.getHttpServer())
        .patch(`/books/${book.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateBookDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Book updated successfully.');
          expect(res.body.book).toBeDefined();
        });
    });
    it('should throw Notfound exception if book not exists', () => {
      return request(app.getHttpServer())
        .patch(`/books/${wrongId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Book not found!');
        });
    });
  });

  describe('Delete Book DELETE /books/:bookId', () => {
    it('should delete book', async () => {
      const bookForDelete = await createBook(
        booksRepository,
        createBookDto,
        category.id,
      );
      return request(app.getHttpServer())
        .delete(`/books/${bookForDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Book deleted successfully.');
        });
    });
    it('should throw Notfound exception', () => {
      return request(app.getHttpServer())
        .delete(`/books/${wrongId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Book not found!');
        });
    });
  });

  describe('Upload Book Image POST /books/medias/:bookId', () => {
    it('should upload book media', () => {
      const filePath = path.resolve(__dirname, 'public/test/test.png');
      return request(app.getHttpServer())
        .post(`/books/medias/${book.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', filePath)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual('Book uploaded successfully.');
        });
    });
  });

  describe('Delete Book Image DELETE /books/:booksId/image/:imageId', () => {
    it('should delete book media', () => {
      return request(app.getHttpServer())
        .post(`/books/${book.id}/medias/${book.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Books deleted successfully.');
        });
    });
  });

  describe('Create Book Attribute POST /books/attributes/:bookId', () => {
    it('should create a new book attribute', async () => {
      return request(app.getHttpServer())
        .post(`/books/attributes/${book.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBookAttributeDtoMethod)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Book attribute created successfully.',
          );
          expect(res.body.attribute).toBeDefined();
        });
    });

    it('should throw conflict error if book attribute with this data already exists', async () => {
      return request(app.getHttpServer())
        .post(`/books/attributes/${book.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBookAttributeDtoMethod)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Book attribute with this language already exists!',
          );
        });
    });
  });

  describe('Update Book Attribute PATCH /books/:bookId/attributes/:attributeId', () => {
    it('should update category attribute', async () => {
      return request(app.getHttpServer())
        .patch(`/books/${book.id}/attributes/${bookAttribute.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBookAttributeDtoMethod)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute updated successfully.');
          expect(res.body.attribute).toBeDefined();
        });
    });

    it('should throw not found error if book attribute not found', async () => {
      return request(app.getHttpServer())
        .patch(`/books/${book.id}/attributes/${wrongId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute not found!');
        });
    });
  });

  describe('Delete Book Attribute DELETE /books/:bookId/attributes/:attributeId', () => {
    it('should delete book attribute', async () => {
      const attribute = await createOneBookAttribute(
        bookAttributeRepository,
        createBookAttribute,
        book.id,
      );
      return request(app.getHttpServer())
        .delete(`/books/${book.id}/attributes/${attribute.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute deleted successfully.');
        });
    });

    it('should throw not found error if book attribute not found', async () => {
      return request(app.getHttpServer())
        .delete(`/books/${wrongId}/attributes/${bookAttribute.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute not found!');
        });
    });
  });

  describe('Should return link for downloading book', () => {
    it('should download book', async () => {
      await request(app.getHttpServer())
        .get(`/books/${book.id}/download`)
        .query(validDownloadBookQuery)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.media).toEqual(MediaEntity);
        });
    });

    it('should throw error if book not found', async () => {
      await request(app.getHttpServer())
        .get(`/books/${wrongId}/download`)
        .query(validDownloadBookQuery)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Book not found!');
        });
    });

    it('should throw not found error if media not found', async () => {
      await request(app.getHttpServer())
        .get(`/books/${book.id}/download`)
        .query(invalidDownloadBookQuery)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.media).toEqual('Media not found!');
        });
    });
  });
});

async function cleanupTestData(
  categoryRepository: Repository<CategoryEntity>,
  booksRepository: Repository<BooksEntity>,
  userRepository: Repository<UserEntity>,
  adminUserRepository: Repository<AdminUserEntity>,
) {
  try {
    await booksRepository.delete({});
    await categoryRepository.delete({});
    await userRepository.delete({});
    await adminUserRepository.delete({});
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

async function createCategory(
  categoryRepository: Repository<CategoryEntity>,
  dto: CreateCategoryDto,
) {
  const category = categoryRepository.create(dto);
  await categoryRepository.save(category);
  return category;
}

async function createBook(
  bookRepository: Repository<BooksEntity>,
  dto: CreateBookDto,
  categoryId: string,
) {
  const book = bookRepository.create({ ...dto, categoryId: categoryId });
  await bookRepository.save(book);
  return book;
}

async function createHighLevelUser(
  userRepository: Repository<UserEntity>,
  dto: UserRegistrationDto,
) {
  const user = userRepository.create({ ...dto, level: 6, isVerified: true });
  await userRepository.save(user);
  return user;
}
async function createLowLevelUser(
  userRepository: Repository<UserEntity>,
  dto: UserRegistrationDto,
) {
  const user = userRepository.create({ ...dto, level: 1, isVerified: true });
  await userRepository.save(user);
  return user;
}

async function createOneBookAttribute(
  bookAttributeRepository: Repository<BooksAttributesEntity>,
  dto: CreateBookAttributeDto,
  bookId: string,
) {
  const bookAttribute = bookAttributeRepository.create({
    ...dto,
    bookId: bookId,
  });
  await bookAttributeRepository.save(bookAttribute);
  return bookAttribute;
}

async function createAdminUser(
  adminUserRepository: Repository<AdminUserEntity>,
  dto: CreateAdminUserDto,
) {
  const admin = adminUserRepository.create(dto);
  await adminUserRepository.save(admin);

  return admin;
}
