import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as cookieParser from 'cookie-parser';
import { UserRegistrationDto } from '../src/client/auth/dto/userRegistration.dto';
import { UserEntity } from '../src/client/user/entities/user.entity';
import { UserLoginDto } from 'src/client/auth/dto/userLogin.dto';
import { UserVerificationDto } from '../src/client/auth/dto/userVerification.dto';
import * as jwt from 'jsonwebtoken';
import { UserTokenDto } from '../src/client/token/dto/token.dto';
import { hash } from 'bcrypt';
import { generateRandomSixDigitNumber } from '../src/helpers/providers/generateVerificationCode';
import { AuthModule } from '../src/client/auth/auth.module';
import { AuthService } from '../src/client/auth/auth.service';
import { TokenModule } from '../src/client/token/token.module';

describe('ClientAuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let user: UserEntity;
  let userForVerify: UserEntity;
  let authService: AuthService;

  let userRegistrationDto: UserRegistrationDto = {
    email: 'test123@gmail.com',
    nickName: 'David123',
    password: 'David123!',
  };

  let userLoginForRefresh: UserLoginDto = {
    email: 'test123@gmail.com',
    password: 'David123!',
  };

  let userRegistrationForRegistration: UserRegistrationDto = {
    email: 'test3@gmail.com',
    nickName: 'David123',
    password: 'David123!',
  };

  let userForVerifyDto: UserRegistrationDto = {
    email: 'test53453@gmail.com',
    nickName: 'David1235',
    password: 'David123!',
  };

  let wrongEmailLoginDto: UserLoginDto = {
    email: 'test1@gmail.com',
    password: 'David123!',
  };

  let wrongPasswordLoginDto: UserLoginDto = {
    email: 'test3@gmail.com',
    password: 'David1234!',
  };

  let userLoginDto: UserLoginDto = {
    email: 'test3@gmail.com',
    password: 'David123!',
  };

  let correctVerificationCode: UserVerificationDto = {
    verificationCode: '1234',
  };

  let wrongVerificationCode: UserVerificationDto = {
    verificationCode: '6666',
  };

  let wrongId = 'e5001bd4-a01b-4b12-97fa-ec804a7a2e8b';

  let invalidRefreshToken: string;
  let refreshToken: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, Redis, AuthModule, TokenModule],
      providers: [
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        AuthService,
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    user = await createUser(userRegistrationDto, userRepository);
    userForVerify = await createUser(userForVerifyDto, userRepository);
    authService = moduleFixture.get<AuthService>(AuthService);
    const correctUserDto = new UserTokenDto(user);
    accessToken = jwt.sign(
      { ...correctUserDto },
      process.env.JWT_CLIENT_ACCESS_SECRET,
      { expiresIn: '3h' },
    );
    refreshToken = jwt.sign(
      { ...correctUserDto },
      process.env.JWT_CLIENT_REFRESH_SECRET,
      { expiresIn: '3h' },
    );
    invalidRefreshToken = jwt.sign(
      { ...correctUserDto },
      process.env.JWT_CLIENT_ACCESS_SECRET,
      { expiresIn: '3h' },
    );
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await cleanupTestData(userRepository);
    const redis = app.get(Redis);
    redis.disconnect();
    await app.close();
  });

  describe('should register user POST /auth/registration', () => {
    it('should register a new user POST /auth/registration', async () => {
      await request(app.getHttpServer())
        .post('/auth/registration')
        .send(userRegistrationForRegistration)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual(
            'User registration successfully. Verification code sent to your email',
          );
          expect(res.body.user).toBeDefined();
        });
    }, 200000);

    it('should throw conflict exception POST /auth/registration', async () => {
      await request(app.getHttpServer())
        .post('/auth/registration')
        .send(userRegistrationForRegistration)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toEqual(
            `User with email ${userRegistrationForRegistration.email} already exists`,
          );
        });
    });
  });

  describe('User should login to system POST /auth/login', () => {
    it('should login to system POST /auth/login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(userLoginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toEqual('User login successfully');
          expect(res.body.user).toBeDefined();
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('should throw bad request exception if password is not correct POST /auth/login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(wrongPasswordLoginDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual('User password incorrect!');
        });
    });

    it('should throw bad request exception if email is not correct POST /auth/login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(wrongEmailLoginDto)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual(
            `User with email ${wrongEmailLoginDto.email} not found`,
          );
        });
    });
  });

  describe('should verify user account PATCH /auth/userId/verify', () => {
    it('should verify user account PATCH /auth/userId/verify', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${userForVerify.id}/verify`)
        .send(correctVerificationCode)
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          expect(res.body.message).toEqual('User verified successfully!');
        });
    });

    it('should throw bad request exception if verification code is not correct PATCH /auth/userId/verify', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${user.id}/verify`)
        .send(wrongVerificationCode)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual('Wrong verification code');
        });
    });

    it('should throw not found exception if user not found PATCH /auth/userId/verify', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${wrongId}/verify`)
        .send(wrongVerificationCode)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('User not found');
        });
    });

    it('should throw not conflict exception if user already verified PATCH /auth/userId/verify', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${userForVerify.id}/verify`)
        .send(correctVerificationCode)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toEqual('User is already verified');
        });
    });
  });

  describe('Should refresh user tokens GET /auth/refresh', () => {
    it('should refresh user tokens successfully GET /auth/refresh', async () => {
      await authService.loginUser(userLoginForRefresh);
      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe(
            'System user tokens refreshed successfully!',
          );
          expect(res.body.user).toBeDefined();
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('should throw new unauthorized if token is not provided GET /auth/refresh', async () => {
      await request(app.getHttpServer())
        .get('/auth/refresh')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Refresh token not provided');
        });
    });

    it('should throw new unauthorized if token invalid GET /auth/refresh', async () => {
      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Cookie', [`refreshToken=${invalidRefreshToken}`])
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe(
            'Token not found! Please register first',
          );
        });
    });
  });

  describe('logout user from system POST /auth/logout', () => {
    it('should log out user from system', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Log out successfully!');
        });
    });

    it('should throw new unauthorized if token is not provided POST /auth/logout', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Refresh token not provided');
        });
    });

    it('should throw new unauthorized if token is not found POST /auth/logout', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', [`refreshToken=${accessToken}`])
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe(
            'Token not found! Please register first',
          );
        });
    });
  });
});

async function cleanupTestData(userRepository: Repository<UserEntity>) {
  try {
    await userRepository.delete({});
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

async function createUser(
  dto: UserRegistrationDto,
  userRepository: Repository<UserEntity>,
) {
  const user = userRepository.create({
    nickName: dto.nickName,
    password: dto.password,
    email: dto.email,
  });
  const hashedPassword = await hash(user.password, 10);
  user.password = hashedPassword;
  await userRepository.save(user);
  let verificationCode = generateRandomSixDigitNumber();
  if (process.env.NODE_ENV === 'development') verificationCode = '1234';
  user.verificationCode = verificationCode;
  user.verificationCodeTime = new Date(Date.now());
  await userRepository.save(user);
  return user;
}
