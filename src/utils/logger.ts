// import config from 'config';
import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';
import { Format } from 'logform';
import { Options } from 'morgan';
import { Service, Container, Constructable } from 'typedi';
import winston from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');
import * as httpContext from 'express-http-context';
import env from '../env';
import * as bottleneck from 'bottleneck';
import { Request, Response } from 'express';

const timezoned = () => {
  return new Date().toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
  });
};

/**
 * @Logger decorator
 * @param fileName - Filename context
 */
export const Logger = (fileName: string) => {
  return function (object: Constructable<unknown>, propertyName: string, index?: number) {
    const logger = new LoggerService(fileName);
    Container.registerHandler({ object, propertyName, index, value: () => logger });
  };
};

@Service()
export class LoggerService {
  private logDir: string = path.join(__dirname, env.log.dir);
  private bottleneck = new bottleneck.default({ maxConcurrent: 1, minTime: 5 });
  private logger: winston.Logger;
  private loggerHTTP: winston.Logger;

  constructor(private fileName: string) {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }
    this.setupLogger();
    this.setupConsoleStream();
  }

  /**
   * Get main logger object
   * @returns winston logger object
   */
  public getLogger = (): winston.Logger => {
    return this.logger;
  };

  /**
   * Get http logger
   * @returns winston HTTP logger object
   */
  public getHTTPLogger = (): winston.Logger => {
    return this.loggerHTTP;
  };

  /**
   * Common logger format, we strip colors and add a Timestamp
   * @returns LogFormat
   */
  private getFileLogFormat = (): Format => {
    const addContext = winston.format(info => {
      const reqID = this.getRequestUUID();
      if (reqID) {
        info.requestID = reqID;
      }
      const origin = this.getOrigin();
      info.from = origin;
      return info;
    });
    return winston.format.combine(winston.format.uncolorize(), winston.format.timestamp({ format: timezoned }), addContext(), winston.format.json());
  };

  /**
   * Console logger format
   * @returns LogFormat
   */
  private getConsoleLogFormat = (): Format => {
    /**
     * formatted thanks to https://github.com/winstonjs/winston/issues/1135#issuecomment-343980350
     */
    return winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: timezoned }),
      winston.format.align(),
      winston.format.printf(info => {
        const { timestamp, level, message, ...args } = info;
        const ts = timestamp.slice(0, 19).replace('T', ' ');
        const format =
          `${ts} | ${level} | ${this.getOrigin()}` +
          `${this.getRequestUUID() ? ` | ${this.getRequestUUID()} ` : ''} »` +
          ` ${message.replace('\t', '')} ${Object.keys(args).length ? '\n' + JSON.stringify(args, null, 2) : ''}`;
        return format;
      }),
    );
  };

  /**
   * Setup main logger
   */
  private setupLogger = () => {
    if (env.isProduction) {
      // setup transports
      const transportError = new DailyRotateFile({
        level: 'error',
        dirname: this.logDir + '/error',
        filename: `%DATE%.log`,
        format: this.getFileLogFormat(),
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '31d',
        json: false,
        handleExceptions: true,
        handleRejections: true,
      });
      const transportCombined = new DailyRotateFile({
        level: 'info',
        dirname: this.logDir + '/combined',
        filename: `%DATE%.log`,
        format: this.getFileLogFormat(),
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '31d',
        json: false,
      });
      const transportHTTP = new DailyRotateFile({
        format: winston.format.combine(
          winston.format.uncolorize(),
          winston.format.printf(info => {
            const message = info.message;
            return message;
          }),
        ),
        dirname: this.logDir + '/http',
        filename: `%DATE%.log`,
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '31d',
        json: false,
      });
      this.logger = winston.createLogger({
        level: 'info',
        transports: [transportError, transportCombined],
      });
      this.loggerHTTP = winston.createLogger({
        level: 'http',
        levels: {
          http: 1,
        },
        transports: [transportHTTP],
      });
    } else {
      this.logger = winston.createLogger({ level: 'info', handleExceptions: true });
      this.loggerHTTP = winston.createLogger({ level: 'http' });
    }
  };

  /**
   * This function is used to get origin from logger object (@Logger(__origin))
   * @returns Returns log origin from file
   */
  private getOrigin = (): string => {
    let origin = this.fileName || 'dev';
    if (this.fileName) {
      origin = origin.replace(process.cwd(), '');
      origin = origin.replace(`${path.sep}src${path.sep}`, '');
      origin = origin.replace(`${path.sep}dist${path.sep}`, '');
      origin = origin.replace(/([.]ts)|([.]js)/, '');
    }
    return origin;
  };

  /**
   * Get request context (UUID)
   * @returns request context
   */
  private getRequestUUID = (): string => {
    const reqId = httpContext.get('reqId');
    return reqId;
  };

  /**
   * Setup console stream
   */
  private setupConsoleStream = () => {
    this.logger.add(new winston.transports.Console({ format: this.getConsoleLogFormat() }));
    this.loggerHTTP.add(new winston.transports.Console({ format: this.getConsoleLogFormat() }));
  };

  /**
   * Log to winston
   * @param level - Logger level
   * @param message - Logger message
   */
  log = (level: string, message: string): void => {
    this.bottleneck.schedule({}, () => {
      return Promise.resolve(this.getLogger().log(level, message));
    });
  };
  /**
   * Log error to winston
   * @param message - Message
   * @param args - args
   */
  error = (message: string, args?: any): void => {
    this.bottleneck.schedule({}, () => {
      return Promise.resolve(this.getLogger().error(message, args));
    });
  };
  /**
   * Log warning to winston
   * @param message - Message
   * @param args - args
   */
  warn = (message: string, args?: any): void => {
    this.bottleneck.schedule({}, () => {
      return Promise.resolve(this.getLogger().warn(message, args));
    });
  };
  /**
   * Log verbose to winston
   * @param message - Message
   * @param args - args
   */
  verbose = (message: string, args?: any): void => {
    this.bottleneck.schedule({}, () => {
      return Promise.resolve(this.getLogger().verbose(message, args));
    });
  };
  /**
   * Log info to winston
   * @param message - Message
   * @param args - args
   */
  info = (message: string, args?: any): void => {
    this.bottleneck.schedule({}, () => {
      return Promise.resolve(this.getLogger().info(message, args));
    });
  };
  /**
   * Log debug to winston
   * @param message - Message
   * @param args - args
   */
  debug = (message: string, args?: any): void => {
    this.bottleneck.schedule({}, () => {
      return Promise.resolve(this.getLogger().debug(message, args));
    });
  };
  /**
   * Log silly to winston
   * @param message - Message
   * @param args - args
   */
  silly = (message: string, args?: any): void => {
    this.bottleneck.schedule({}, () => {
      return Promise.resolve(this.getLogger().silly(message, args));
    });
  };
}

/**
 * Overwrite stream function to throw messages to our http logger
 * @returns Morgan options
 */
export const morganOption: Options<Request, Response> = {
  stream: {
    write: (message: string) => {
      const logger = Container.get(LoggerService);
      logger.getHTTPLogger().log('http', message.replace('\n', ''));
    },
  },
};
