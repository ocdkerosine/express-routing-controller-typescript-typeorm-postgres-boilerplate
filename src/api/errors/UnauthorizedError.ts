import { UnauthorizedError as HttpError } from 'routing-controllers';

export class UnauthorizedError extends HttpError {
  constructor(message?: string) {
    super(message || 'Unauthorized');
  }

  toJSON() {
    return { message: this.message };
  }
}
