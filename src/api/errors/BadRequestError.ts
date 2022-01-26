import { HttpError } from 'routing-controllers';
import { Error } from '@interfaces/base.interface';

export class BadRequestError extends HttpError {
  private errors: Error[];

  constructor({ message, property }: Error) {
    super(400, 'Invalid request');
    this.errors = [{ message, property }];
  }

  toJSON() {
    return { message: this.message, errors: this.errors };
  }
}
