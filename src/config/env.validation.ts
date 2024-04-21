import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  PORT: string;

  @IsString()
  @IsNotEmpty()
  BACKEND_URL: string;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsString()
  @IsNotEmpty()
  DB_PORT: string;

  @IsString()
  @IsNotEmpty()
  DB_USER: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsString()
  @IsNotEmpty()
  REDIS_PORT: string;

  @IsString()
  @IsNotEmpty()
  REDIS_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  REDIS_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  MINIO_ENDPOINT: string;

  @IsString()
  @IsNotEmpty()
  MINIO_PORT: string;

  @IsBoolean()
  @IsNotEmpty()
  MINIO_USE_SSL: boolean;

  @IsString()
  @IsNotEmpty()
  MINIO_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  MINIO_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  MINIO_BUCKET_NAME: string;

  @IsString()
  @IsNotEmpty()
  JWT_ADMIN_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ADMIN_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_CLIENT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_CLIENT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  SMTP_USER: string;

  @IsString()
  @IsNotEmpty()
  SMTP_HOST: string;

  @IsString()
  @IsNotEmpty()
  SMTP_PASS: string;

  @IsString()
  @IsNotEmpty()
  USER_VERIFICATION_CODE_TIME: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_SECRET: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_AUTHORIZATION_REDIRECT: string;
}

export function validate(config: Record<string, unknown>) {
  const validateConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validateConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validateConfig;
}
