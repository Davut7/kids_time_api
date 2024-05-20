import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { TokenService } from '../token/token.service';
import { UserLoginDto } from './dto/userLogin.dto';
import { UserTokenDto } from '../token/dto/token.dto';
import { UserRegistrationDto } from './dto/userRegistration.dto';
import { UserVerificationDto } from './dto/userVerification.dto';
import { UserService } from '../user/user.service';
import { MailsService } from '../../mails/mails.service';
import { generateRandomSixDigitNumber } from '../../helpers/providers/generateVerificationCode';
import { generateHash, verifyHash } from '../../helpers/providers/generateHash';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private tokenService: TokenService,
    private mailsService: MailsService,
    private userService: UserService,
  ) {}

  async registerUser(dto: UserRegistrationDto) {
    const candidate = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (candidate)
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    const hashedPassword = await generateHash(dto.password);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    await this.userRepository.save(user);

    await this.sendVerificationCode(user.id);

    return {
      message:
        'User registration successfully. Verification code sent to your email',
      id: user.id,
      nickName: user.nickName,
      email: user.email,
    };
  }
  async loginUser(dto: UserLoginDto) {
    const user = await this.userService.findOneByEmail(dto.email);
    const isPasswordValid = await verifyHash(dto.password, user.password);
    if (!isPasswordValid)
      throw new BadRequestException(`User password incorrect!`);

    const tokens = this.tokenService.generateTokens({
      ...new UserTokenDto(user),
    });
    await this.tokenService.saveTokens(user.id, tokens.refreshToken);

    return {
      message: 'User login successfully!',
      id: user.id,
      nickName: user.nickName,
      email: user.email,
      ...tokens,
    };
  }

  async logoutUser(refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token not provided');
    await this.tokenService.deleteToken(refreshToken);
    return {
      message: 'User logged out!',
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token not provided');
    const tokenFromDB = await this.tokenService.findToken(refreshToken);
    const validToken = this.tokenService.validateRefreshToken(refreshToken);
    if (!validToken && !tokenFromDB)
      throw new UnauthorizedException('Invalid token');
    const user = await this.userService.findUserById(validToken.id);
    const tokens = this.tokenService.generateTokens({
      ...new UserTokenDto(user),
    });
    await this.tokenService.saveTokens(user.id, tokens.refreshToken);
    return {
      ...tokens,
      user: new UserTokenDto(user),
    };
  }

  async verifyUser(userId: string, dto: UserVerificationDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.verificationCode !== dto.verificationCode)
      throw new BadRequestException('Wrong verification code');
    if (
      Date.now() - +user.verificationCodeTime >=
      +process.env.USER_VERIFICATION_CODE_TIME
    )
      throw new BadRequestException(`Activation code expired!`);
    if (user.isVerified)
      throw new ConflictException('User is already verified');

    user.isVerified = true;
    await this.userRepository.save(user);

    const tokens = this.tokenService.generateTokens({
      ...new UserTokenDto(user),
    });

    await this.tokenService.saveTokens(user.id, tokens.refreshToken);

    return {
      message: 'User login successful!',
      user,
      ...tokens,
    };
  }

  async sendVerificationCode(userId: string) {
    const user = await this.userService.findUserById(userId);
    let verificationCode = generateRandomSixDigitNumber();
    if (process.env.NODE_ENV === 'development') verificationCode = '1234';
    user.verificationCode = verificationCode;
    user.verificationCodeTime = new Date(Date.now());
    await this.mailsService.sendVerificationCode(verificationCode, user.email);
    await this.userRepository.save(user);
    return {
      message: 'Verification code sent successfully.',
    };
  }

  async googleLogin(req) {
    if (!req.user) {
      throw new BadRequestException('No user from google');
    }

    const user = new UserEntity();
    user.email = req.user.email;
    user.nickName = req.user.firstName;
    user.isVerified = true;

    return await this.loginOrSignup(user);
  }

  async loginOrSignup(user: UserEntity) {
    const userFromDb = await this.userRepository.findOne({
      where: { email: user.email },
    });
    if (userFromDb) {
      const tokens = this.tokenService.generateTokens({
        ...new UserTokenDto(user),
      });
      userFromDb.isVerified = true;
      await this.userRepository.save(userFromDb);
      await this.tokenService.saveTokens(user.id, tokens.refreshToken);

      return {
        message: 'User login successful!',
        user,
        ...tokens,
      };
    }

    const newUser = this.userRepository.create({ ...user, isVerified: true });
    await this.userRepository.save(newUser);
    const tokens = this.tokenService.generateTokens({
      ...new UserTokenDto(newUser),
    });
    await this.tokenService.saveTokens(user.id, tokens.refreshToken);

    return {
      message: 'User login successful!',
      user,
      ...tokens,
    };
  }
}
