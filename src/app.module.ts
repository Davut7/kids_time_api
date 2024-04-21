import { MiddlewareConsumer, Module, OnModuleInit } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './utils/core/allException.filter';
import { MinioService } from './minio/minio.service';
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
import { SharedModule } from './shared/shared.module';
import { MediaModule } from './media/media.module';
import { RedisModule } from './redis/redis.module';
import { AdminUserService } from './admin/user/user.service';
import { CreateUserDto } from './admin/user/dto/createUser.dto';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './client/auth/auth.module';
import { TokenModule } from './client/token/token.module';
import { UserModule } from './client/user/user.module';
import { BooksModule } from './books/books.module';
import { MinioModule } from './minio/minio.module';
import { DrawingsModule } from './drawings/drawings.module';
import { FavoritesModule } from './favorites/favorites.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      validate,
      isGlobal: true,
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
    TerminusModule.forRoot(),
    LoggerModule,
    // HealthModule,
    AdminAuthModule,
    AdminTokenModule,
    AdminUserModule,
    MailsModule,
    SharedModule,
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
    const user: CreateUserDto = {
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
