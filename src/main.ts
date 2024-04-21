import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import * as Sentry from '@sentry/node';
import { SentryFilter } from './helpers/filters/sentry.filter';
import CustomLogger from './logger/helpers/customLogger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const port = process.env.PORT;
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['log', 'debug', 'error', 'warn'],
  });

  const config = new DocumentBuilder()
    .setTitle('Kids time server')
    .setDescription('Kids time server api documentation')
    .setVersion('1.0')
    .addTag('Kids time')
    .addServer('/api')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
  });

  SwaggerModule.setup('api/docs', app, document, { useGlobalPrefix: true });
  app.enableShutdownHooks();
  app.use(helmet());
  app.enableCors({
    credentials: true,
    origin: '*',
  });
  app.use(cookieParser(`${process.env.COOKIE_SECRET}`));
  app.use(compression());
  app.useGlobalPipes(new ValidationPipe());
  Sentry.init({
    dsn: process.env.SENTRY_DNS,
  });
  // const { httpAdapter } = app.get(HttpAdapterHost);
  // app.useGlobalFilters(new SentryFilter(httpAdapter));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('api');
  await app.listen(port, () => {
    console.log(`Your server is listening on port ${port}`);
  });

  app.useLogger(app.get(CustomLogger, { strict: false }));
}

bootstrap();
