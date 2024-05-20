import * as Joi from 'joi';

const envVarsSchema = Joi.object({
  PORT: Joi.string().required(),
  BACKEND_URL: Joi.string().required(),
  COOKIE_SECRET: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.string().required(),
  REDIS_USERNAME: Joi.string().required(),
  REDIS_PASSWORD: Joi.string().required(),
  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_PORT: Joi.string().required(),
  MINIO_USE_SSL: Joi.boolean().required(),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),
  MINIO_BUCKET_NAME: Joi.string().required(),
  JWT_ADMIN_ACCESS_SECRET: Joi.string().required(),
  JWT_ADMIN_REFRESH_SECRET: Joi.string().required(),
  JWT_CLIENT_ACCESS_SECRET: Joi.string().required(),
  JWT_CLIENT_REFRESH_SECRET: Joi.string().required(),
  SMTP_USER: Joi.string().email().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  USER_VERIFICATION_CODE_TIME: Joi.string().required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_SECRET: Joi.string().required(),
  GOOGLE_AUTHORIZATION_REDIRECT: Joi.string().required(),
  SENTRY_URI: Joi.string().required(),
  SENTRY_DNS: Joi.string().required(),
}).unknown();

export function validate(config: Record<string, unknown>) {
  const { error, value } = envVarsSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
}
