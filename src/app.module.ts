import { MiddlewareConsumer, Module, OnModuleInit } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './utils/core/allException.filter';
import { LogsMiddleware } from './logger/middleware/logs.middleware';
import DatabaseLogger from './logger/helpers/databaseLogger';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from './logger/logger.module';
import { TerminusModule } from '@nestjs/terminus';
import { AdminAuthModule } from './admin/auth/auth.module';
import { AdminTokenModule } from './admin/token/token.module';
import { AdminUserModule } from './admin/user/user.module';
import { MailsModule } from './mails/mails.module';
import { MediaModule } from './media/media.module';
import { RedisModule } from './redis/redis.module';
import { AdminUserService } from './admin/user/user.service';
import { CreateAdminUserDto } from './admin/user/dto/createUser.dto';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './client/auth/auth.module';
import { TokenModule } from './client/token/token.module';
import { UserModule } from './client/user/user.module';
import { BooksModule } from './books/books.module';
import { MinioModule } from './minio/minio.module';
import { DrawingsModule } from './drawings/drawings.module';
import { FavoritesModule } from './favorites/favorites.module';
// import { validate } from './config/env.validation';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      // validate,
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: ['entity/**/.entity.ts'],
        migrations: ['src/migrations/*.ts'],
        migrationsTableName: 'custom_migration_table',
        autoLoadEntities: true,
        synchronize: true,
        logger: new DatabaseLogger(),
      }),
    }),
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        ttl: 60,
        host: configService.getOrThrow<string>('REDIS_HOST'),
        port: configService.getOrThrow<number>('REDIS_PORT'),
        username: configService.getOrThrow<string>('REDIS_USERNAME'),
        password: configService.getOrThrow<string>('REDIS_PASSWORD'),
        no_ready_check: true,
      }),
    }),
    TerminusModule.forRoot(),
    LoggerModule,
    // HealthModule,
    AdminAuthModule,
    AdminTokenModule,
    AdminUserModule,
    MailsModule,
    MediaModule,
    MinioModule,
    RedisModule,
    CategoryModule,
    AuthModule,
    TokenModule,
    UserModule,
    BooksModule,
    DrawingsModule,
    FavoritesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private adminUserService: AdminUserService) {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogsMiddleware).forRoutes('*');
  }
  async onModuleInit() {
    const user: CreateAdminUserDto = {
      firstName: 'admin',
      password: 'Admin123!',
    };
    const users = await this.adminUserService.isAdminUserExists();
    if (users.length <= 0) {
      await this.adminUserService.createUser(user);
    } else {
      return console.log('Default admin user already exists');
    }
  }
}
