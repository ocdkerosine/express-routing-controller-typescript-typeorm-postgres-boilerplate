import { ValidationError as ClassValidatorError } from 'class-validator';
import { HttpError } from 'routing-controllers';

export class ValidationError extends HttpError {
  public errors: ClassValidatorError[];

  constructor(errors: ClassValidatorError[]) {
    super(400, 'Invalid request');
    this.errors = errors;
  }

  toJSON() {
    return { message: this.message, errors: this.errors };
  }
}
