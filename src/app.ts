import 'reflect-metadata';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import './extensions';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import env from '@/env';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { useExpressServer, getMetadataArgsStorage, useContainer as routingUseContainer } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUi from 'swagger-ui-express';
import errorMiddleware from '@middlewares/error.middleware';
import { authorizationChecker, currentUserChecker } from '@middlewares/auth.middleware';
import * as httpContext from 'express-http-context';
import { Logger, LoggerService, morganOption } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Container } from 'typedi';
import { Container as ContainerI } from 'typeorm-typedi-extensions';
import { useContainer as classValidatorUseContainer } from 'class-validator';
import { useContainer as ormUseContainer } from 'typeorm';
import { Database } from './database/configuration/Database';
import Monitor from 'express-status-monitor';
import { SocketService, QueueService, BackgroundService } from '@services/.';
import { Server } from 'http';
import actuator from 'express-actuator';

class App {
  public app: express.Application;
  public port: string | number | boolean;
  public env: string;
  public server: Server;

  constructor(Controllers: Function[], @Logger(__filename) private logger: LoggerService = new LoggerService(__filename)) {
    this.initalizeContainers();
    this.app = express();
    this.port = env.app.port;
    this.env = env.node;

    this.initializeMiddlewares();
    this.initializeRoutes(Controllers);
    this.initializeSwagger(Controllers);
    this.initializeErrorHandling();
    this.initalizeDatabase();
  }

  public listen() {
    this.server = this.app.listen(this.port, () => {
      this.logger.info(`=======================================`);
      this.logger.info(`======= ENV: ${this.env} ==============`);
      this.logger.info(`🚀 App listening on the port ${this.port}`);
      this.logger.info(`http(s)://${env.app.host}:${env.app.port}${env.app.routePrefix}`);
      this.logger.info(`=======================================`);
    });
    Container.get(SocketService).connect(this.server);
    this.server.on('close', async () => {
      Container.get(QueueService).destroy();
      Container.get(BackgroundService).cancelAll();
      this.logger.info('Server shutdown successful, closing db connection.');
      await Container.get(Database).stopDatabase();
      this.logger.info('Shutdown complete.');
    });
    return this.server;
  }

  public getServer() {
    return this.app;
  }

  private initalizeContainers() {
    classValidatorUseContainer(Container, { fallback: true, fallbackOnErrors: true });
    routingUseContainer(Container);
    ormUseContainer(ContainerI);
  }

  private initializeMiddlewares() {
    this.app.use(morgan(env.log.format, morganOption));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(
      helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: { scriptSrc: ["'self'", "'sha256-smeKlzoBksVYJbpIwiP/yNzhQLzmXzVRkIh1Wvvydz4='", 'https://cdnjs.cloudflare.com'] },
      }),
    );
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(httpContext.middleware);
    this.app.use((req, _res, next) => {
      httpContext.set('ip', req.ip);
      httpContext.set('reqId', uuidv4());
      httpContext.set('useragent', req.headers['user-agent']);
      next();
    });
    this.app.use((_req, res, next) => {
      res.setHeader('X-Powered-By', 'Paylot');
      next();
    });
    this.app.get('/', (_req, res) => {
      res.status(404).send('');
    });
    this.app.use(
      actuator({
        customEndpoints: [
          {
            id: 'health/database',
            controller: async (_req: express.Request, res: express.Response) => {
              (await Container.get(Database).getConnection()) ? res.status(200).json({ status: 'UP' }) : res.status(400).json({ status: 'DOWN' });
            },
          },
        ],
      }),
    );
    if (env.monitor.enabled) {
      this.app.use(
        Monitor({
          path: env.monitor.route,
          title: `${env.app.name}`,
          healthChecks: [
            { protocol: 'http', host: 'localhost', path: '/health', port: env.app.port.toString() },
            { protocol: 'http', host: 'localhost', path: '/health/database', port: env.app.port.toString() },
          ],
        }),
      );
    }
  }

  private initializeRoutes(controllers: Function[]) {
    useExpressServer(this.app, {
      cors: {
        origin: true,
        credentials: true,
      },
      validation: {
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        whitelist: true,
      },
      controllers: controllers,
      middlewares: [__dirname + '/api/middlewares/*{.ts,.js}'],
      interceptors: [__dirname + '/api/interceptors/*{.ts,.js}'],
      routePrefix: env.app.routePrefix,
      defaultErrorHandler: false,
      currentUserChecker,
      authorizationChecker,
    });
  }

  private async initalizeDatabase() {
    await Container.get(Database)
      .initializeDatabase()
      .then(async () => {
        await Container.get(QueueService).startConsuming();
      });
  }

  private initializeSwagger(controllers: Function[]) {
    const schemas = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
      refPointerPrefix: '#/components/schemas/',
    });

    const routingControllersOptions = {
      controllers: controllers,
    };

    const storage = getMetadataArgsStorage();
    const spec = routingControllersToSpec(storage, routingControllersOptions, {
      components: {
        schemas,
        securitySchemes: {
          bearerAuth: {
            scheme: 'bearer',
            type: 'http',
            bearerFormat: 'JWT',
          },
        },
      },
      info: {
        description: 'Generated with `routing-controllers-openapi`',
        title: 'A sample API',
        version: '1.0.0',
      },
    });

    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default App;
