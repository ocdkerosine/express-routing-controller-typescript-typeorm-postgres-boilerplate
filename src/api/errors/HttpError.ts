import { HttpError as RCHttpError } from 'routing-controllers';

export class HttpError extends RCHttpError {
  public status: number;
  public message: string;

  constructor(status: number, message: string) {
    super(status, message);
    this.status = status;
    this.message = message;
  }

  toJSON() {
    return { status: this.status, message: this.message };
  }
}
