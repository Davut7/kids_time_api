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
import { UserEntity } from '../src/client/user/entities/user.entity';
import { UserRegistrationDto } from '../src/client/auth/dto/userRegistration.dto';
import { UserTokenDto } from '../src/client/token/dto/token.dto';
import { LanguageEnum } from '../src/helpers/constants/languageEnum';
import { AdminUserEntity } from '../src/admin/user/entities/adminUser.entity';
import { CreateAdminUserDto } from '../src/admin/user/dto/createUser.dto';
import { AdminTokenDto } from '../src/admin/token/dto/token.dto';
import { DrawingsAttributesEntity } from '../src/drawings/entities/drawingsAttributes.entity';
import { DrawingsEntity } from '../src/drawings/entities/drawings.entity';
import { CreateDrawingsAttributeDto } from '../src/drawings/dto/createDrawingAttribute.dto';
import { CreateDrawingDto } from '../src/drawings/dto/createDrawing.dto';
import { UpdateDrawingsDto } from '../src/drawings/dto/updateDrawings.dto';
import { MediaEntity } from '../src/media/entities/mediaEntity';
import { DownloadDrawingsQuery } from 'src/drawings/dto/downloadDrawing.query';

describe('DrawingsController Endpoints', () => {
  let app: INestApplication;
  let categoryRepository: Repository<CategoryEntity>;
  let drawingsRepository: Repository<DrawingsEntity>;
  let userRepository: Repository<UserEntity>;
  let drawingAttributeRepository: Repository<DrawingsAttributesEntity>;
  let adminUserRepository: Repository<AdminUserEntity>;
  let category: CategoryEntity;
  let drawing: DrawingsEntity;
  let highLevelUser: UserEntity;
  let lowLevelUser: UserEntity;
  let token: string;
  let adminToken: string;
  let invalidToken: string;
  let drawingsAttribute: DrawingsAttributesEntity;
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
    title: 'Drawings category',
    categoryType: CategoryTypeEnum.drawings,
  };

  let createDrawingsDto: CreateDrawingDto = {
    requiredLevel: 5,
  };

  let updateDrawingsDto: UpdateDrawingsDto = {
    requiredLevel: 5,
  };

  let createDrawingsAttributeDtoMethod: CreateDrawingsAttributeDto = {
    language: LanguageEnum.en,
    description: 'Good drawings',
    title: 'Title',
  };

  let createDrawingsAttribute: CreateDrawingsAttributeDto = {
    language: LanguageEnum.hi,
    description: 'Good drawings',
    title: 'Best drawings',
  };

  let createAdminUserDto: CreateAdminUserDto = {
    firstName: 'Admin',
    password: 'Admin123!',
  };

  let validDownloadDrawingQuery: DownloadDrawingsQuery = {
    drawingLng: LanguageEnum.hi,
  };

  let invalidDownloadDrawingQuery: DownloadDrawingsQuery = {
    drawingLng: LanguageEnum.en,
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
          provide: getRepositoryToken(DrawingsEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DrawingsAttributesEntity),
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
    drawingsRepository = moduleFixture.get(getRepositoryToken(DrawingsEntity));
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    drawingAttributeRepository = moduleFixture.get(
      getRepositoryToken(DrawingsAttributesEntity),
    );
    adminUserRepository = moduleFixture.get(
      getRepositoryToken(AdminUserEntity),
    );
    category = await createCategory(categoryRepository, createCategoryDto);
    drawing = await createDrawings(
      drawingsRepository,
      createDrawingsDto,
      category.id,
    );
    drawingsAttribute = await createOneDrawingsAttribute(
      drawingAttributeRepository,
      createDrawingsAttribute,
      drawing.id,
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
      drawingsRepository,
      userRepository,
      adminUserRepository,
      drawingAttributeRepository,
    );
    await app.close();
  });

  describe('Create drawings POST /drawings', () => {
    it('should create drawings', () => {
      return request(app.getHttpServer())
        .post(`/drawings/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDrawingsDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual('Drawing created successfully.');
          expect(res.body.drawing).toBeDefined();
        });
    });
    it('should throw not found exception if category not found', () => {
      return request(app.getHttpServer())
        .post(`/drawings/${wrongId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDrawingsDto)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Category not found!');
        });
    });
  });

  describe('Get All drawings GET /drawings', () => {
    it('should return all drawings', () => {
      return request(app.getHttpServer())
        .get('/drawings')
        .expect(200)
        .expect((res) => {
          expect(res.body.drawings).toBeDefined();
          expect(res.body.drawingsCount).toBeGreaterThan(0);
        });
    });
  });

  describe('Get One drawings by Id GET /drawings/:drawingsId', () => {
    it('should return one drawings by id', () => {
      return request(app.getHttpServer())
        .get(`/drawings/${drawing.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
    it('should throw Notfound exception if drawings not exists', () => {
      return request(app.getHttpServer())
        .get(`/drawings/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Drawing not found!');
        });
    });

    it('should throw Forbidden exception if level lower than required', () => {
      return request(app.getHttpServer())
        .get(`/drawings/${drawing.id}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Your level is lower than required!',
          );
        });
    });
  });

  describe('Update drawings PATCH /drawings/:drawingsId', () => {
    it('should update drawings', async () => {
      return request(app.getHttpServer())
        .patch(`/drawings/${drawing.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDrawingsDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Drawing updated successfully.');
          expect(res.body.drawing).toBeDefined();
        });
    });
    it('should throw Notfound exception if drawings not exists', () => {
      return request(app.getHttpServer())
        .patch(`/drawings/${wrongId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Drawing not found!');
        });
    });
  });

  describe('Delete drawings DELETE /drawings/:drawingsId', () => {
    it('should delete drawings', async () => {
      const drawingsForDelete = await createDrawings(
        drawingsRepository,
        createDrawingsDto,
        category.id,
      );
      return request(app.getHttpServer())
        .delete(`/drawings/${drawingsForDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Drawing deleted successfully.');
        });
    });
    it('should throw Notfound exception', () => {
      return request(app.getHttpServer())
        .delete(`/drawings/${wrongId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Drawing not found!');
        });
    });
  });

  describe('Upload drawings Image POST /drawings/medias/:drawingsId', () => {
    it('should upload drawings media', () => {
      const filePath = path.resolve(__dirname, 'public/test/test.png');
      return request(app.getHttpServer())
        .post(`/drawings/medias/${drawing.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', filePath)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual('Drawings uploaded successfully.');
        });
    });
  });

  describe('Delete drawings Image DELETE /drawings/:drawingsId/image/:imageId', () => {
    it('should delete drawings media', () => {
      return request(app.getHttpServer())
        .post(`/drawings/${drawing.id}/medias/${drawing.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Drawing deleted successfully.');
        });
    });
  });

  describe('Create drawings Attribute POST /drawings/attributes/:drawingsId', () => {
    it('should create a new drawings attribute', async () => {
      return request(app.getHttpServer())
        .post(`/drawings/attributes/${drawing.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDrawingsAttributeDtoMethod)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Drawing attribute created successfully.',
          );
          expect(res.body.attribute).toBeDefined();
        });
    });

    it('should throw conflict error if drawings attribute with this data already exists', async () => {
      return request(app.getHttpServer())
        .post(`/drawings/attributes/${drawing.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDrawingsAttributeDtoMethod)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'Drawings attribute with this language already exists!',
          );
        });
    });
  });

  describe('Update drawings Attribute PATCH /drawings/:drawingsId/attributes/:attributeId', () => {
    it('should update category attribute', async () => {
      return request(app.getHttpServer())
        .patch(`/drawings/${drawing.id}/attributes/${drawingsAttribute.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDrawingsAttributeDtoMethod)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute updated successfully.');
          expect(res.body.attribute).toBeDefined();
        });
    });

    it('should throw not found error if drawings attribute not found', async () => {
      return request(app.getHttpServer())
        .patch(`/drawings/${drawing.id}/attributes/${wrongId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute not found!');
        });
    });
  });

  describe('Delete drawings Attribute DELETE /drawings/:drawingsId/attributes/:attributeId', () => {
    it('should delete drawings attribute', async () => {
      const attribute = await createOneDrawingsAttribute(
        drawingAttributeRepository,
        createDrawingsAttribute,
        drawing.id,
      );
      return request(app.getHttpServer())
        .delete(`/drawings/${drawing.id}/attributes/${attribute.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute deleted successfully.');
        });
    });

    it('should throw not found error if drawings attribute not found', async () => {
      return request(app.getHttpServer())
        .delete(`/drawings/${wrongId}/attributes/${drawingsAttribute.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Attribute not found!');
        });
    });
  });

  describe('Should return link for downloading drawing', () => {
    it('should download drawing', async () => {
      await request(app.getHttpServer())
        .get(`/drawings/${drawing.id}/download`)
        .query(validDownloadDrawingQuery)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.media).toEqual(MediaEntity);
        });
    });

    it('should throw error if drawing not found', async () => {
      await request(app.getHttpServer())
        .get(`/drawings/${wrongId}/download`)
        .query(validDownloadDrawingQuery)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('Drawing not found!');
        });
    });

    it('should throw not found error if media not found', async () => {
      await request(app.getHttpServer())
        .get(`/drawings/${drawing.id}/download`)
        .query(invalidDownloadDrawingQuery)
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
  drawingsRepository: Repository<DrawingsEntity>,
  userRepository: Repository<UserEntity>,
  adminUserRepository: Repository<AdminUserEntity>,
  drawingAttributesRepository: Repository<DrawingsAttributesEntity>,
) {
  try {
    await drawingAttributesRepository.delete({});
    await drawingsRepository.delete({});
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

async function createDrawings(
  drawingsRepository: Repository<DrawingsEntity>,
  dto: CreateDrawingDto,
  categoryId: string,
) {
  const drawings = drawingsRepository.create({
    ...dto,
    categoryId: categoryId,
  });
  await drawingsRepository.save(drawings);
  return drawings;
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

async function createOneDrawingsAttribute(
  drawingAttributeRepository: Repository<DrawingsAttributesEntity>,
  dto: CreateDrawingsAttributeDto,
  drawingId: string,
) {
  const drawingsAttribute = drawingAttributeRepository.create({
    ...dto,
    drawingId: drawingId,
  });
  await drawingAttributeRepository.save(drawingsAttribute);
  return drawingsAttribute;
}

async function createAdminUser(
  adminUserRepository: Repository<AdminUserEntity>,
  dto: CreateAdminUserDto,
) {
  const admin = adminUserRepository.create(dto);
  await adminUserRepository.save(admin);

  return admin;
}
