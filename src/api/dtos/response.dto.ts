import { PaginatedResponseMeta } from '@interfaces/base.interface';
import { IsNotEmpty, IsDate, IsNotEmptyObject } from 'class-validator';
import { User } from '@entities/.';

export class Response<T = any> {
  status: string;
  message?: string;
  data: T;
}

export class PaginatedResponse<T = any> {
  status: string;
  message?: string;
  data: T[];
  meta: PaginatedResponseMeta;
}

export class UserCreatedResponse {
  @IsNotEmptyObject()
  user: User;
}

export class UserLoginResponse extends UserCreatedResponse {
  @IsNotEmpty()
  accessToken: string;

  @IsDate()
  @IsNotEmpty()
  expiryDate: Date;
}
