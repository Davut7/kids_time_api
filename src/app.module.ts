import { MiddlewareConsumer, Module, OnModuleInit } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './utils/core/allException.filter';
import { MinioService } from './minio/minio.service';
import { LogsMiddleware } from './logger/middleware/logs.middleware';
import DatabaseLogger from './logger/helpers/databaseLogger';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: `.${process.env.NODE_ENV}.env` }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ['entity/**/.entity.ts'],
      migrations: ['src/migrations/*.ts'],
      migrationsTableName: 'custom_migration_table',
      autoLoadEntities: true,
      synchronize: true,
      logger: new DatabaseLogger(),
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
    RedisModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    MinioService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private adminUserService: AdminUserService) {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogsMiddleware).forRoutes('*');
  }
  async onModuleInit() {
    const user: CreateUserDto = {
      name: 'admin',
      password: 'Admin123!',
    };
    if (!(await this.adminUserService.isAdminUserExists(user.name))) {
      await this.adminUserService.createUser(user);
    } else {
      return console.log('Default admin user already exists');
    }
  }
}
