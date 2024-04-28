import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../src/category/entities/category.entity';
import { CategoryAttributesEntity } from '../src/category/entities/categoryAttributes.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as jwt from 'jsonwebtoken';
import { UserEntity } from '../src/client/user/entities/user.entity';
import { CreateMailDto } from '../src/mails/dto/createMail.dto';
import { UserTokenDto } from '../src/client/token/dto/token.dto';

describe('MailController E2E test', () => {
  let app: INestApplication;
  let categoryRepository: Repository<CategoryEntity>;
  let categoryAttributesRepository: Repository<CategoryAttributesEntity>;

  let user: UserEntity = {
    id: 'e5001bd4-a01b-4b12-97fa-ec804a7a2e8b',
    nickName: 'david',
    email: 'test@gmail.com',
    password: 'test123!',
    isVerified: true,
  };

  let createMailDto: CreateMailDto = {
    firstName: 'David123',
    email: 'David123!',
    message: 'David123!',
  };

  const userDto = new UserTokenDto(user);

  let token = jwt.sign({ ...userDto }, process.env.JWT_CLIENT_ACCESS_SECRET, {
    expiresIn: '30d',
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    categoryRepository = moduleFixture.get(getRepositoryToken(CategoryEntity));
    categoryAttributesRepository = moduleFixture.get(
      getRepositoryToken(CategoryAttributesEntity),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  }, 20000);

  describe('Send mail with information', () => {
    it('should send mail successfully', async () => {
      await request(app.getHttpServer())
        .post('/mails')
        .send(createMailDto)
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual('Mail send successfully!');
        });
    }, 20000);
  });
});
