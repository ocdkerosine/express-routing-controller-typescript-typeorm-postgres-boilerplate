import { NotFoundError as HttpError } from 'routing-controllers';

export class NotFoundError extends HttpError {
  constructor(message?: string) {
    super(message || 'Resource not found');
  }

  toJSON() {
    return { message: this.message };
  }
}
