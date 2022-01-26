import * as dotenv from 'dotenv';
import * as path from 'path';

import { getOsEnv, getOsEnvOptional, getOsPath, getOsPaths, normalizePort, toBool, toNumber } from './utils/env';

/**
 * Load .env file or for tests the .env.test file.
 */
dotenv.config({
  path: path.join(process.cwd(), `.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`),
});

/**
 * Environment variables
 */
const env = {
  node: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  isDevelopment: process.env.NODE_ENV === 'development',
  app: {
    name: getOsEnv('APP_NAME'),
    host: getOsEnv('APP_HOST'),
    scheme: getOsEnv('APP_SCHEME'),
    routePrefix: getOsEnv('APP_ROUTE_PREFIX'),
    port: normalizePort(process.env.PORT || getOsEnv('APP_PORT')),
    banner: toBool(getOsEnv('APP_BANNER')),
    dirs: {
      migrations: getOsPaths('TYPEORM_MIGRATIONS'),
      migrationsDir: getOsPath('TYPEORM_MIGRATIONS_DIR'),
      entities: getOsPaths('TYPEORM_ENTITIES'),
      entitiesDir: getOsPath('TYPEORM_ENTITIES_DIR'),
      controllers: getOsPaths('CONTROLLERS'),
      middlewares: getOsPaths('MIDDLEWARES'),
      interceptors: getOsPaths('INTERCEPTORS'),
      subscribers: getOsPaths('SUBSCRIBERS'),
      resolvers: getOsPaths('RESOLVERS'),
    },
    username: getOsEnvOptional('APP_USERNAME'),
    password: getOsEnvOptional('APP_PASSWORD'),
  },
  mail: {
    sandboxMode: toBool(getOsEnv('MAIL_SANDBOX_MODE')),
    fromEmail: getOsEnv('MAIL_FROM_ADDRESS'),
    fromName: getOsEnv('MAIL_FROM_NAME'),
    verifyEmailUrl: getOsEnvOptional('VERIFY_EMAIL_BASE_URL'),
    resetPasswordUrl: getOsEnvOptional('RESET_PASSWORD_BASE_URL'),
  },
  jwt: {
    secretKey: getOsEnv('JWT_SECRET'),
    daysValid: toNumber(getOsEnv('JWT_DAYS_VALIDITY')),
  },
  log: {
    level: getOsEnv('LOG_LEVEL'),
    json: toBool(getOsEnvOptional('LOG_JSON')),
    output: getOsEnv('LOG_OUTPUT'),
    format: 'dev',
    dir: '../../logs',
  },
  db: {
    url: getOsEnvOptional('TYPEORM_URL'),
    host: getOsEnvOptional('TYPEORM_HOST'),
    ssl: toBool(getOsEnvOptional('TYPEORM_SSL')),
    username: getOsEnvOptional('TYPEORM_USERNAME'),
    password: getOsEnvOptional('TYPEORM_PASSWORD'),
    database: getOsEnvOptional('TYPEORM_DATABASE'),
    port: toNumber(getOsEnvOptional('TYPEORM_PORT')),
    type: getOsEnvOptional('TYPEORM_CONNECTION_TYPE'),
    maxTryReconnect: Number(getOsEnvOptional('TYPEORM_MAX_TRY_RECONNECT')),
    reconnectSeconds: Number(getOsEnvOptional('TYPEORM_RECONNECT_SECONDS')),
  },
  monitor: {
    enabled: toBool(getOsEnv('MONITOR_ENABLED')),
    route: getOsEnv('MONITOR_ROUTE'),
  },
  firebase: {
    apiKey: getOsEnvOptional('FIREBASE_API_KEY'),
    redirectUrl: getOsEnvOptional('FIREBASE_REDIRECT_URL'),
  },
  cron: {
    delay: Number(getOsEnvOptional('CRON_PROCESS_DELAY') || 2),
  },
  rabbitmq: {
    url: getOsEnv('RABBIT_MQ_URL'),
    queuePrefix: getOsEnv('RABBIT_MQ_QUEUE_PREFIX'),
  },
};

export default env;
