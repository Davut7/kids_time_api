import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SkipCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const shouldSkipCache = request.url.includes('/admin/auth/refresh');

    if (shouldSkipCache) {
      return next.handle();
    }

    return next.handle();
  }
}
