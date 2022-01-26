import { Action } from 'routing-controllers';
import { Container } from 'typedi';
import { LoggerService } from '@utils/logger';
import { UserService, JWTService } from '@services/.';
import { BoundAuthObject } from '../interfaces/base.interface';

const log = new LoggerService(__filename);

function extract(action: Action): string {
  const authorization: string = action.request.headers['authorization'];
  if (!authorization) {
    return null;
  }
  return authorization;
}

function parseBearer(authorization: string) {
  return { token: authorization.replace('Bearer', '').trim(), type: 'bearer' };
}

// in case of using api keys
// function parseKeys(authorization: string) {
//   return {
//     token: authorization.replace('Bearer', '').trim().split('-')[1],
//     type: 'key',
//     mode: authorization.replace('Bearer', '').trim().split('-')[0].includes('sk') ? 'secret' : 'public',
//     domain: authorization.replace('Bearer', '').trim().split('-')[0].includes('test') ? 'test' : 'live',
//   };
// }

function parse(action: Action): { token: string; type: string; mode?: string } {
  const authorization: string = extract(action);
  if (authorization === null) {
    return null;
  }
  // const prefix = authorization.replace('Bearer', '').trim().split('-')[0];
  // if (prefix.includes('pk') || prefix.includes('sk')) {
  //   return parseKeys(authorization);
  // }
  return parseBearer(authorization);
}

export async function authorizationChecker(action: Action, roles: any[]): Promise<boolean> {
  const credentials = parse(action);
  if (credentials === null) {
    log.warn('No credentials given');
    return false;
  }
  if (credentials.type === 'bearer') {
    const jwtService = Container.get(JWTService);
    const tokenData = jwtService.verify(credentials.token);
    if (tokenData === null) {
      log.warn('Invalid credentials given');
      return false;
    }
    const userService = Container.get(UserService);
    const user = await userService.getUserById(tokenData.sub);
    if (!user || !user.active) {
      log.warn('Invalid credentials given');
      return false;
    }
    return roles.length == 0 || roles.includes(user.role);
  }
  // if (credentials.type === 'key') {
  //   if (!credentials.mode || credentials.mode === 'public') {
  //     log.warn('Invalid credentials given');
  //     return false;
  //   }
  //   const secret = Keys.decrypt(credentials.token);
  //   if (!secret) {
  //     log.warn('Invalid credentials given');
  //     return false;
  //   }
  //   //TODO add check for test/live or implement adapter style
  //   const keys = await Container.get(KeysService).getKeyBy({ secret: secret });
  //   if (!keys) {
  //     log.warn('Invalid credentials given');
  //     return false;
  //   }
  //   const merchant = await Container.get(MerchantService).getMerchantById(keys.merchantId);
  //   if (!merchant || !merchant.active) {
  //     log.warn('Invalid credentials given');
  //     return false;
  //   }
  //   return true;
  // }
  return false;
}

export async function currentUserChecker(action: Action): Promise<BoundAuthObject | null> {
  const credentials = parse(action);
  if (credentials === null) {
    log.warn('No credentials given');
    return null;
  }
  if (credentials.type === 'bearer') {
    const jwtService = Container.get(JWTService);
    const tokenData = jwtService.verify(credentials.token);
    if (tokenData === null) {
      log.warn('Invalid credentials given');
      return null;
    }
    const userService = Container.get(UserService);
    const user = await userService.getUserById(tokenData.sub);
    if (!user || !user.active) {
      log.warn('Invalid credentials given');
      return null;
    }
    return { user, env: '' };
  }
  // if (credentials.type === 'key') {
  //   if (credentials.mode === 'public') {
  //     log.warn('Invalid credentials given');
  //     return null;
  //   }
  //   const secret = Keys.decrypt(credentials.token);
  //   if (!secret) {
  //     log.warn('Invalid credentials given');
  //     return null;
  //   }
  //   const key = await Container.get(KeysService).getKeyBy({ secret: secret });
  //   if (!key) {
  //     log.warn('Invalid credentials given');
  //     return null;
  //   }
  //   const userService = Container.get(UserService);
  //   const user = await userService.getUserById(key.userId);
  //   if (!user || !user.active) {
  //     log.warn('Invalid credentials given');
  //     return null;
  //   }
  //   return { user, env: key.domain };
  // }
  return null;
}
