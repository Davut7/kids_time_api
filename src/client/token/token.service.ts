import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenEntity } from './entities/token.entity';
import { UserTokenDto } from './dto/token.dto';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
  ) {}

  generateTokens(payload: UserTokenDto) {
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_CLIENT_ACCESS_SECRET,
      {
        expiresIn: '10m',
      },
    );
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_CLIENT_REFRESH_SECRET,
      {
        expiresIn: '30d',
      },
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  async saveTokens(userId: string, refreshToken: string) {
    const user = await this.tokenRepository.findOne({
      where: { user: { id: userId } },
    });

    if (user) {
      user.refreshToken = refreshToken;
      this.tokenRepository.save(user);
      return user;
    }
    const token = this.tokenRepository.create({
      user: { id: userId },
      refreshToken: refreshToken,
    });
    await this.tokenRepository.save(token);
    return token;
  }

  validateAccessToken(accessToken: string) {
    try {
      const token = jwt.verify(
        accessToken,
        process.env.JWT_CLIENT_ACCESS_SECRET,
      );
      return token as UserTokenDto;
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  validateRefreshToken(refreshToken: string) {
    try {
      const token = jwt.verify(
        refreshToken,
        process.env.JWT_CLIENT_REFRESH_SECRET,
      );
      return token as UserTokenDto;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async deleteToken(refreshToken: string) {
    const token = await this.findToken(refreshToken);
    await this.tokenRepository.delete({
      refreshToken: token.refreshToken,
    });
    return { message: 'Token deleted successfully!' };
  }

  async findToken(refreshToken: string) {
    const token = await this.tokenRepository.findOne({
      where: { refreshToken: refreshToken },
    });
    if (!token)
      throw new UnauthorizedException('Token not found! Please register first');
    return token;
  }
}
