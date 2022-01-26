import { NextFunction, Request, Response } from 'express';
import { HttpError } from '@errors/HttpError';
import { LoggerService } from '@utils/logger';
import { ValidationError } from 'class-validator';
import { BadRequestError } from 'routing-controllers';
import { MulterError } from 'multer';
import { IpDeniedError } from 'express-ipfilter';
import env from '@/env';

class ErrorFormat {
  status: string;
  message: string;
  errors?: any;
  path: string;
}

const isTest = env.isTest;
const isProduction = env.isProduction;
const logger = new LoggerService(__filename);

const errorMiddleware = (error: HttpError, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const message: string = error.message || 'An unexpected error occurred on the server';
    const stack: any = error.stack || '';

    if (error instanceof IpDeniedError) {
      const data: ErrorFormat = { status: 'error', message: 'Invalid request', path: `${req.path}` };
      res.status(400).json(data);
      return;
    }
    if (error instanceof MulterError) {
      const data: ErrorFormat = { status: 'error', message: 'Bad Request', errors: [{ message: message, property: '' }], path: `${req.path}` };
      res.status(400).json(data);
    } else if (error instanceof BadRequestError) {
      let data: ErrorFormat = { status: 'error', message: 'Bad Request', errors: [{ message: message, property: '' }], path: `${req.path}` };
      const errors: [] = error['errors'] ?? [];
      if (errors.length === 0) res.status(400).json(data);
      const formattedErrors = getFormattedErrors(errors);
      data = { status: 'error', message: 'Bad Request', errors: formattedErrors, path: `${req.path}` };
      res.status(400).json(data);
    } else {
      const data: ErrorFormat = { status: 'error', message: message, path: `${req.path}` };
      if (error['errors']) data.errors = error['errors'];
      res.status(error.httpCode || 500);
      res.json(data);
      if (isTest) return;
      if (data.errors) logger.info('Validation Errors', { errors: data.errors });
      isProduction
        ? logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`)
        : logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}, Stack:: ${stack}`);
    }
  } catch (error) {
    next(error);
  }
};

const getFormattedErrors = (errors: ValidationError[], prefix: string = null) => {
  const formattedErrors = [];

  errors.forEach((x: ValidationError) => {
    if (x.constraints) {
      const messages: string[] = Object.values(x.constraints);
      if (prefix) {
        messages.forEach(message => {
          formattedErrors.push({ message, property: `${prefix}.${x.property}` });
        });
      } else {
        messages.forEach(message => {
          formattedErrors.push({ message, property: x.property });
        });
      }
    } else {
      formattedErrors.push(...getFormattedErrors(x.children, x.property));
    }
  });
  return formattedErrors;
};

export default errorMiddleware;
