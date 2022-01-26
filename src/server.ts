import 'dotenv/config';
import App from '@/app';
import { AuthController } from '@controllers/auth.controller';
import { IndexController } from '@controllers/index.controller';
// import { UsersController } from '@controllers/users.controller';
// import validateEnv from '@utils/validateEnv';
import { LoggerService } from '@utils/logger';

// validateEnv();

const app = new App([AuthController, IndexController]);
const server = app.listen();

const logger = new LoggerService(__filename);

const shutdownNow = (): void => {
  logger.info('Could not close connections in time, forcefully shutting down.');
  process.exit(1);
};

let shuttingDown = false;

const gracefulShutdown = (): void => {
  if (shuttingDown) return;
  logger.info('Shutting down.');
  shuttingDown = true;
  server.close();
  setTimeout(shutdownNow, 20 * 1000);
};

const handleKill = (): void => {
  logger.info('Recieved kill command, gracefully shutting down.');
  gracefulShutdown();
};

const handleUncaughtException = (err: any): void => {
  logger.error('Uncaught Exception: ', err);
  gracefulShutdown();
};

process.on('message', msg => {
  if (msg === 'shutdown') handleKill();
});

process.on('SIGTERM', handleKill);

process.on('SIGINT', handleKill);

process.on('uncaughtException', handleUncaughtException);
