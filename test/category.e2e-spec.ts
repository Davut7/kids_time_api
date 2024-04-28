import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../src/category/entities/category.entity';
import { CategoryAttributesEntity } from '../src/category/entities/categoryAttributes.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as path from 'path';
import { AdminUserEntity } from '../src/admin/user/entities/adminUser.entity';
import { CreateCategoryDto } from '../src/category/dto/createCategory.dto';
import { CreateCategoryAttributeDto } from '../src/category/dto/createCategoryAttribute.dto';
import { CategoryTypeEnum } from '../src/helpers/constants/categoryType.enum';
import { LanguageEnum } from '../src/helpers/constants/languageEnum';
import { AdminTokenDto } from '../src/admin/token/dto/token.dto';
import * as jwt from 'jsonwebtoken';

describe('CategoryController Endpoints', () => {
  let app: INestApplication;
  let categoryRepository: Repository<CategoryEntity>;
  let categoryAttributesRepository: Repository<CategoryAttributesEntity>;
  let category: CategoryEntity;
  let categoryAttribute: CategoryAttributesEntity;

  let adminUser: AdminUserEntity = {
    id: 'e5001bd4-a01b-4b12-97fa-ec804a7a2e8b',
    firstName: 'David123',
    password: 'David123!',
  };

  let createCategoryDto: CreateCategoryDto = {
    title: 'Books category',
    categoryType: CategoryTypeEnum.book,
  };

  let createCategoryAttributeDtoMethod: CreateCategoryAttributeDto = {
    language: LanguageEnum.ru,
    title: 'Book title',
    description: 'Book description',
  };

  let createCategoryAttributeDto: CreateCategoryAttributeDto = {
    language: LanguageEnum.en,
    title: 'Book title',
    description: 'Book description',
  };
  const wrongId = 'e5001bd4-a01b-4b12-97fa-ec804a7a2e8b';

  const userDto = new AdminTokenDto(adminUser);

  let token = jwt.sign({ ...userDto }, process.env.JWT_ADMIN_ACCESS_SECRET, {
    expiresIn: '30d',
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: getRepositoryToken(CategoryEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(CategoryAttributesEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    categoryRepository = moduleFixture.get(getRepositoryToken(CategoryEntity));
    categoryAttributesRepository = moduleFixture.get(
      getRepositoryToken(CategoryAttributesEntity),
    );
    category = await createCategory(categoryRepository, createCategoryDto);
    categoryAttribute = await createCategoryAttribute(
      categoryAttributesRepository,
      createCategoryAttributeDto,
      category.id,
    );

    await app.init();
  });

  afterAll(async () => {
    await cleanupTestData(categoryRepository, categoryAttributesRepository);
    await app.close();
  });

  describe('Create Category POST /category', () => {
    it('should create category', () => {
      return request(app.getHttpServer())
        .post('/category')
        .set('Authorization', `Bearer ${token}`)
        .send(createCategoryDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual('Category created successfully.');
          expect(res.body.category).toBeDefined();
        });
    });
  });

  describe('Get All Categories GET /category', () => {
    it('should return all categories', () => {
      return request(app.getHttpServer())
        .get('/category')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.categories).toBeDefined();
          expect(res.body.categoriesCount).toBeGreaterThan(0);
        });
    });
  });

  describe('Get One Category by Id GET /category/:categoryId', () => {
    it('should return one category by id', () => {
      return request(app.getHttpServer())
        .get(`/category/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.category).toBeDefined();
        });
    });
    it('should throw Notfound exception', () => {
      return request(app.getHttpServer())
        .get(`/category/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Category not found!');
        });
    });
  });

  describe('Update Category PATCH /category/:categoryId', () => {
    it('should update category', async () => {
      return request(app.getHttpServer())
        .patch(`/category/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(createCategoryDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Category updated successfully.');
          expect(res.body.category).toBeDefined();
        });
    });
    it('should throw Notfound exception', () => {
      return request(app.getHttpServer())
        .patch(`/category/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Category not found!');
        });
    });
  });

  describe('Delete Category DELETE /category/:categoryId', () => {
    it('should delete category', async () => {
      const categoryForDelete = await createCategory(
        categoryRepository,
        createCategoryDto,
      );
      return request(app.getHttpServer())
        .delete(`/category/${categoryForDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Category deleted successfully.');
        });
    });
    it('should throw Notfound exception', () => {
      return request(app.getHttpServer())
        .delete(`/category/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Category not found!');
        });
    });
  });

  describe('Upload Category Image POST /category/images/:categoryId', () => {
    it('should upload category image', () => {
      const filePath = path.resolve(__dirname, 'public/test/test.png');
      return request(app.getHttpServer())
        .post(`/category/images/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('image', filePath)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Category image uploaded successfully.',
          );
        });
    });
  });

  describe('Delete Category Image DELETE /category/:categoryId/image/:imageId', () => {
    it('should delete category image', () => {
      const filePath = path.resolve(__dirname, 'public/test/test.png');
      return request(app.getHttpServer())
        .post(`/category/${category.id}/images/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('image', filePath)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Category image deleted successfully.',
          );
        });
    });
  });

  describe('Create Category Attribute POST /category/attributes/:categoryId', () => {
    it('should create a new category attribute', async () => {
      return request(app.getHttpServer())
        .post(`/category/attributes/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(createCategoryAttributeDtoMethod)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Category attribute created successfully.',
          );
          expect(res.body.attribute).toBeDefined();
        });
    });

    it('should throw conflict error if category attribute with this data already exists', async () => {
      return request(app.getHttpServer())
        .post(`/category/attributes/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(createCategoryAttributeDtoMethod)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Category attribute with this language already exists!',
          );
        });
    });
  });

  describe('Update Category Attribute PATCH /category/:categoryId/attributes/:attributeId', () => {
    it('should update category attribute', async () => {
      return request(app.getHttpServer())
        .patch(`/category/${category.id}/attributes/${categoryAttribute.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(createCategoryAttributeDtoMethod)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute updated successfully.');
          expect(res.body.attribute).toBeDefined();
        });
    });

    it('should throw not found error if category attribute with this data already exists', async () => {
      return request(app.getHttpServer())
        .patch(`/category/${category.id}/attributes/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute not found!');
        });
    });
  });

  describe('Delete Category Attribute DELETE /category/:categoryId/attributes/:attributeId', () => {
    it('should delete category attribute', async () => {
      return request(app.getHttpServer())
        .delete(`/category/${category.id}/attributes/${categoryAttribute.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute deleted successfully.');
        });
    });

    it('should throw not found error if category attribute with this not exists', async () => {
      return request(app.getHttpServer())
        .delete(`/category/${category.id}/attributes/${categoryAttribute.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute not found!');
        });
    });
  });
});

async function cleanupTestData(
  categoryRepository: Repository<CategoryEntity>,
  categoryAttributesRepository: Repository<CategoryAttributesEntity>,
) {
  try {
    await categoryRepository.delete({});
    await categoryAttributesRepository.delete({});
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

async function createCategoryAttribute(
  categoryAttributesRepository: Repository<CategoryAttributesEntity>,
  dto: CreateCategoryAttributeDto,
  categoryId: string,
) {
  const category = categoryAttributesRepository.create({
    ...dto,
    categoryId: categoryId,
  });
  await categoryAttributesRepository.save(category);
  return category;
}
