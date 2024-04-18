import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { AdminTokenService } from 'src/admin/token/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokenService: AdminTokenService,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) throw new UnauthorizedException('User unauthorized');
      const bearer = authHeader.split(' ')[0];
      const token = authHeader.split(' ')[1];

      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException('User unauthorized');
      }

      const userToken = this.tokenService.validateAccessToken(token);

      const tokenInBlackList = await this.redisService.getRedisToken(token);
      if (tokenInBlackList) throw new UnauthorizedException('Token is invalid');
      req.currentUser = userToken;
      return true;
    } catch (e) {
      throw new UnauthorizedException('User unauthorized');
    }
  }
}
