import { TokenService } from '../../client/token/token.service';
import { RedisService } from '../../redis/redis.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/isPublic.decorator';
import { IS_CLIENT_KEY } from '../common/decorators/clientAuth.decorator';
import { IS_ADMIN_KEY } from '../common/decorators/adminAuth.decorator';
import { AdminTokenService } from '../../admin/token/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private clientTokenService: TokenService,
    private adminTokenService: AdminTokenService,
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isClient = this.reflector.getAllAndOverride(IS_CLIENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isAdmin = this.reflector.getAllAndOverride(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    try {
      if (isPublic) return true;
      const authHeader = req.headers.authorization;
      if (!authHeader) throw new UnauthorizedException('User unauthorized');
      const bearer = authHeader.split(' ')[0];
      const token = authHeader.split(' ')[1];

      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException('User unauthorized');
      }

      if (isClient) {
        const userToken = this.clientTokenService.validateAccessToken(token);
        if (!userToken.isVerified)
          throw new ForbiddenException('Please verify your account');
        const tokenInBlackList = await this.redisService.getRedisToken(token);
        if (tokenInBlackList)
          throw new UnauthorizedException('Token is invalid');
        req.currentUser = userToken;
        return true;
      }

      if (isAdmin) {
        const userToken = this.adminTokenService.validateAccessToken(token);
        const tokenInBlackList = await this.redisService.getRedisToken(token);
        if (tokenInBlackList)
          throw new UnauthorizedException('Token is invalid');
        req.currentUser = userToken;
        return true;
      }
    } catch (e) {
      throw new UnauthorizedException('User unauthorized');
    }
  }
}
