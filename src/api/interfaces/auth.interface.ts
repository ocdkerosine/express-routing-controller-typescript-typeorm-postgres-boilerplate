import { User } from '@entities/user.entity';

export interface DataStoredInToken {
  sub: string;
  exp: number;
}

export interface IToken {
  token: string;
  expiresIn: Date;
}

export interface LoginData {
  user: User;
  cookie: string;
  tokenData: IToken;
}

export interface IVerifyEmail {
  email: string;
  hash: string;
  code: string;
}

export interface IResetPassword extends IVerifyEmail {
  password: string;
}
