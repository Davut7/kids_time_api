import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AdminUserService } from '../../src/admin/user/user.service';
import { Repository } from 'typeorm';
import { AdminUserEntity } from '../../src/admin/user/entities/adminUser.entity';
import { Redis } from 'ioredis';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateAdminUserDto } from '../../src/admin/user/dto/createUser.dto';
import * as cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import { AdminTokenDto } from '../../src/admin/token/dto/token.dto';
import { generateHash } from '../../src/helpers/providers/generateHash';

describe('AdminAuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<AdminUserEntity>;
  let adminUser: AdminUserEntity;
  let createAdminUserDto: CreateAdminUserDto = {
    firstName: 'David123',
    password: 'David123!',
  };
  let refreshToken: string;
  let accessToken: string;
  let invalidRefreshToken: string;
  let adminUserForToken: AdminUserEntity = {
    id: 'e5001bd4-a01b-4b12-97fa-ec804a7a2e8b',
    firstName: 'David123',
    password: 'David123!',
  };
  const adminTokenDto = new AdminTokenDto(adminUserForToken);
  invalidRefreshToken = jwt.sign(
    { ...adminTokenDto },
    process.env.JWT_ADMIN_ACCESS_SECRET,
    {
      expiresIn: '15m',
    },
  );
  accessToken = jwt.sign(
    { ...adminTokenDto },
    process.env.JWT_ADMIN_ACCESS_SECRET,
    {
      expiresIn: '15m',
    },
  );
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, Redis],
      providers: [
        AdminUserService,
        {
          provide: getRepositoryToken(AdminUserEntity),
          useClass: Repository,
        },
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    userRepository = moduleFixture.get(getRepositoryToken(AdminUserEntity));
    adminUser = await createAdminUser(createAdminUserDto, userRepository);
    await app.init();
  });

  afterAll(async () => {
    const redis = app.get(Redis);
    await cleanupTestData(userRepository);
    redis.disconnect();
    await app.close();
  });

  describe('User login to account POST /admin/auth/login', () => {
    it('should login registered user successfully', async () => {
      const userLoginDto = { firstName: 'David123', password: 'David123!' };
      return request(app.getHttpServer())
        .post('/admin/auth/login')
        .send(userLoginDto)
        .expect(200)
        .expect((res) => {
          refreshToken = res.body.refreshToken;
          expect(res.body.message).toBe('User login successfully.');
          expect(res.body.id).toBeDefined();
          expect(res.body.firstName).toBe(createAdminUserDto.firstName);
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('should return 404 if user not found', async () => {
      const userLoginDto = {
        firstName: 'NonExistentUser',
        password: 'SomePassword',
      };
      return request(app.getHttpServer())
        .post('/admin/auth/login')
        .send(userLoginDto)
        .expect(404)
        .expect((res) => {
          const { message } = res.body;
          expect(message).toEqual(
            `User with first name ${userLoginDto.firstName} not found!`,
          );
        });
    });

    it('should return 400 if user password incorrect', async () => {
      const userLoginDto = {
        firstName: 'David123',
        password: 'IncorrectPassword213',
      };
      return request(app.getHttpServer())
        .post('/admin/auth/login')
        .send(userLoginDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('User password incorrect!');
        });
    });
  });

  describe('Should refresh user tokens GET /admin/auth/refresh', () => {
    it('should refresh user tokens successfully', async () => {
      return request(app.getHttpServer())
        .get('/admin/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('User tokens refreshed successfully.');
          expect(res.body.user).toBeDefined();
        });
    });
    it('should throw new unauthorized if token is not provided', () => {
      return request(app.getHttpServer())
        .get('/admin/auth/refresh')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Refresh token not provided!');
        });
    });
    it('should throw new unauthorized if token invalid', () => {
      return request(app.getHttpServer())
        .get('/admin/auth/refresh')
        .set('Cookie', [`refreshToken=${invalidRefreshToken}`])
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid token!');
        });
    });
  });

  describe('User logout from system POST /admin/auth/logout', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/admin/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Log out successfully.');
        });
    });
  });
});

async function cleanupTestData(userRepository: Repository<AdminUserEntity>) {
  try {
    await userRepository.delete({});
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

async function createAdminUser(
  dto: CreateAdminUserDto,
  userRepository: Repository<AdminUserEntity>,
) {
  const user = userRepository.create(dto);
  const hashedPassword = await generateHash(user.password);
  user.password = hashedPassword;
  await userRepository.save(user);

  return user;
}
