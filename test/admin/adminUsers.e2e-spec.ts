import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CreateAdminUserDto } from '../../src/admin/user/dto/createUser.dto';
import { DataSource, In } from 'typeorm';
import { AdminUserEntity } from '../../src/admin/user/entities/adminUser.entity';
import { Redis } from 'ioredis';
import * as jwt from 'jsonwebtoken';
import { AdminTokenDto } from '../../src/admin/token/dto/token.dto';

describe('AdminUserController (e2e)', () => {
  let app: INestApplication;
  let adminUser: AdminUserEntity = {
    id: '',
    firstName: 'David123',
    password: 'David123!',
  };
  let createUserDto: CreateAdminUserDto = {
    firstName: 'David123',
    password: 'David123!',
  };

  const wrongUserId = 'e5001bd4-a01b-4b12-97fa-ec804a7a2e8b';

  let wrongUser: AdminUserEntity = {
    id: wrongUserId,
    firstName: 'David777',
    password: 'David777!',
  };

  const userFirstNames = ['David777', 'David123'];
  const userDto = new AdminTokenDto(adminUser);

  let token = jwt.sign({ ...userDto }, process.env.JWT_ADMIN_ACCESS_SECRET, {
    expiresIn: '30d',
  });

  const wrongUserDto = new AdminTokenDto(wrongUser);
  let wrongToken = jwt.sign(
    { ...wrongUserDto },
    process.env.JWT_ADMIN_ACCESS_SECRET,
    { expiresIn: '30d' },
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, Redis],
    }).compile();

    app = moduleFixture.createNestApplication();
    const dataSource = app.get(DataSource);
    await cleanupTestData(dataSource, userFirstNames);
    await app.init();
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    await cleanupTestData(dataSource, userFirstNames);
    const redis = app.get(Redis);
    redis.disconnect();
    await app.close();
  });

  describe('Creating new admin user POST /admin/users/create-user', () => {
    const CREATE_USER_URL = '/admin/users/create-user';
    it('should create a new admin user', () => {
      return request(app.getHttpServer())
        .post(CREATE_USER_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(createUserDto)
        .expect(201)
        .expect((res) => {
          const { user, message } = res.body;
          adminUser.id = user.id;
          const updatedUserDto = new AdminTokenDto(adminUser);
          const updatedToken = jwt.sign(
            { ...updatedUserDto },
            process.env.JWT_ADMIN_ACCESS_SECRET,
            {
              expiresIn: '10d',
            },
          );

          token = updatedToken;
          expect(message).toEqual('User created successfully!');
          expect(user).toBeDefined();
          expect(user.id).toBeDefined();
          expect(user.firstName).toEqual(createUserDto.firstName);
        });
    });

    it('should return conflict error if user already exists', () => {
      return request(app.getHttpServer())
        .post('/admin/users/create-user')
        .set('Authorization', `Bearer ${token}`)
        .send(createUserDto)
        .expect(409)
        .expect((res) => {
          const { message } = res.body;
          expect(message.trim()).toEqual(
            `User with firstName ${createUserDto.firstName} already exists!`,
          );
        });
    });
  });

  describe('Get all admin users GET /admin/users', () => {
    it('should get all admin users', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          const { message, users, usersCount } = res.body;
          expect(message.trim()).toEqual('User returned successfully');
          expect(users).toEqual(users);
          expect(usersCount).toEqual(usersCount);
        });
    });
  });

  describe('Get user by id GET /admin/users/:userId', () => {
    it('should get user by id', () => {
      return request(app.getHttpServer())
        .get(`/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          const { id, firstName, createdAt, updatedAt } = res.body;
          expect(id).toEqual(adminUser.id);
          expect(firstName).toEqual(adminUser.firstName);
          expect(createdAt).toBeDefined();
          expect(updatedAt).toBeDefined();
        });
    });

    it('should throw Notfound exception if user does not exist', () => {
      return request(app.getHttpServer())
        .get(`/admin/users/${wrongUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          const { message } = res.body;
          expect(message).toEqual(`User with id ${wrongUserId} not found`);
        });
    });
  });

  describe('Update user by id PATCH /admin/users/:userId', () => {
    it('should update user', () => {
      return request(app.getHttpServer())
        .patch(`/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(createUserDto)
        .expect(200)
        .expect((res) => {
          const { message, id, firstName } = res.body;
          expect(message).toEqual('User updated successfully!');
          expect(id).toBeDefined(),
            expect(firstName).toEqual(createUserDto.firstName);
        });
    });
    it('should throw Notfound exception if user does not exist PATCH /admin/users/:userId', () => {
      return request(app.getHttpServer())
        .patch(`/admin/users/${wrongUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          const { message } = res.body;
          expect(message).toEqual(`User with id ${wrongUserId} not found`);
        });
    });
  });

  describe('Delete user by id DELETE /admin/users/:userId', () => {
    it('should delete user by id', () => {
      request(app.getHttpServer())
        .delete(`/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          const { message } = res.body;
          expect(message).toEqual('User deleted successfully!');
        });
    });

    it('should throw BadRequest exception if user tries to delete himself DELETE /admin/users/:userId', () => {
      return request(app.getHttpServer())
        .delete(`/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .expect((res) => {
          const { message } = res.body;
          expect(message).toEqual('You cannot delete yourself!');
        });
    });
    it('should throw Notfound exception if user does not exist DELETE /admin/users/:userId', () => {
      return request(app.getHttpServer())
        .delete(`/admin/users/${wrongUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          const { message } = res.body;
          expect(message).toEqual(`User with id ${wrongUserId} not found`);
        });
    });
  });

  describe('Get current user GET /admin/users/get-me', () => {
    it('Should return current user', () => {
      return request(app.getHttpServer())
        .get('/admin/users/get-me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          const { id, firstName } = res.body;
          expect(id).toBeDefined();
          expect(firstName).toEqual(adminUser.firstName);
        });
    });
    it('should throw Notfound exception if user does not exist Get /admin/users/get-me', () => {
      return request(app.getHttpServer())
        .get(`/admin/users/get-me`)
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(404)
        .expect((res) => {
          const { message } = res.body;
          expect(message).toEqual(`User not found, maybe account deleted`);
        });
    });
  });
});

async function cleanupTestData(
  dataSource: DataSource,
  userFirstNames: string[],
) {
  const connection = dataSource.createEntityManager();
  const userRepository = connection.getRepository(AdminUserEntity);

  try {
    const userToDelete = await userRepository.findOne({
      where: {
        firstName: In(userFirstNames),
      },
    });
    if (userToDelete) {
      await userRepository.remove(userToDelete);
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}
