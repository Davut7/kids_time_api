import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminUserEntity } from '../user/entities/adminUser.entity';
import { Repository } from 'typeorm';
import { AdminTokenService } from '../token/token.service';
import { AdminTokenDto } from '../token/dto/token.dto';
import { LoginDto } from './dto/userLogin.dto';
import { compare } from 'bcrypt';
@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private userRepository: Repository<AdminUserEntity>,
    private tokenService: AdminTokenService,
  ) {}

  async loginUser(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { firstName: dto.firstName },
    });
    if (!user)
      throw new NotFoundException(`User with ${dto.firstName} not found!`);

    const isPasswordValid = await compare(dto.password, user.password);
    if (!isPasswordValid)
      throw new BadRequestException(`User password incorrect!`);

    const tokens = this.tokenService.generateTokens({
      ...new AdminTokenDto(user),
    });

    await this.tokenService.saveTokens(user.id, tokens.refreshToken);

    return {
      message: 'User login successful!',
      user: user,
      ...tokens,
    };
  }

  async logoutUser(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException();
    await this.tokenService.deleteToken(refreshToken);
    return {
      message: 'User logged out!',
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException();
    const tokenFromDB = await this.tokenService.findToken(refreshToken);
    const validToken = this.tokenService.validateRefreshToken(refreshToken);
    if (!validToken && !tokenFromDB) throw new UnauthorizedException();
    const user = await this.userRepository.findOne({
      where: { id: validToken.id },
    });
    const tokens = this.tokenService.generateTokens({
      ...new AdminTokenDto(user),
    });
    await this.tokenService.saveTokens(user.id, tokens.refreshToken);
    return {
      ...tokens,
      user: new AdminTokenDto(user),
    };
  }
}
