import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminTokenDto } from './dto/token.dto';
import { AdminTokenEntity } from './entities/token.entity';

@Injectable()
export class AdminTokenService {
  constructor(
    @InjectRepository(AdminTokenEntity)
    private readonly tokenRepository: Repository<AdminTokenEntity>,
  ) {}

  generateTokens(payload: AdminTokenDto) {
    const accessToken = jwt.sign(payload, process.env.JWT_ADMIN_ACCESS_SECRET, {
      expiresIn: '15m',
    });
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_ADMIN_REFRESH_SECRET,
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
        process.env.JWT_ADMIN_ACCESS_SECRET,
      );
      return token as AdminTokenDto;
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  validateRefreshToken(refreshToken: string) {
    try {
      const token = jwt.verify(
        refreshToken,
        process.env.JWT_ADMIN_REFRESH_SECRET,
      );
      return token as AdminTokenDto;
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  async deleteToken(refreshToken: string) {
    const token = await this.tokenRepository.delete({
      refreshToken: refreshToken,
    });
    if (!token)
      throw new UnauthorizedException('Token not found! Please register first');
    return { message: 'Token deleted successfully!' };
  }

  async findToken(refreshToken: string) {
    try {
      const token = await this.tokenRepository.findOne({
        where: { refreshToken: refreshToken },
      });

      return token;
    } catch (err) {
      throw new UnauthorizedException('Token not found! Please register first');
    }
  }
}
