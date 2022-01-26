import jwt from 'jsonwebtoken';
import moment from 'moment';
import { Service } from 'typedi';
import env from '@/env';
import { DataStoredInToken, IToken } from '@interfaces/auth.interface';

@Service()
export class JWTService {
  public sign(userId: string): IToken {
    const expiryDate = moment().add(env.jwt.daysValid, 'days').toDate();
    const epochExpiryDate = Math.round(expiryDate.getTime() / 1000);
    const dataStoredInToken: DataStoredInToken = { sub: userId, exp: epochExpiryDate };
    const token = jwt.sign(dataStoredInToken, env.jwt.secretKey);
    return { token, expiresIn: expiryDate };
  }

  public verify(token: string) {
    try {
      const payload: any = jwt.verify(token, env.jwt.secretKey, { ignoreExpiration: false });
      return payload;
    } catch {
      return null;
    }
  }
}
