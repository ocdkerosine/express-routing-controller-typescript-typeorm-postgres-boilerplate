import { Service } from 'typedi';
import { Logger, LoggerService } from '@utils/logger';
import IPromise from 'bluebird';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Client } from 'live-mutex';

@Service()
export class LockService {
  // be sure to use the docker cli and run "route" to obtain the IP address. it will change if you rebuild the container.
  // localhost is supposed to work. 0.0.0.0 is also supposed to work but if they dont then thats the workaround
  // ref - https://github.com/ORESoftware/live-mutex/issues/46
  static lock = new Client({ port: 6972, host: 'localhost', ttl: 11000, lockRetryMax: 0 });

  constructor(@Logger(__filename) private logger: LoggerService) {
    LockService.lock.emitter.on('warning', function () {
      // eslint-disable-next-line prefer-rest-params
      logger.error('LockError: ', ...arguments);
    });
  }

  async acquire<T = any>(lockKey: string, fn: () => Promise<T>): Promise<T> {
    return new IPromise(async (resolve, reject) => {
      return await LockService.lock.ensure().then(async lock => {
        this.logger.info(`=== Acquiring lock ${lockKey} ===`);
        return await lock
          .acquire(lockKey)
          .then(async ({ key, id }) => {
            this.logger.info(`=== Acquired lock ${id} ${key} ===`);
            try {
              const result = await fn();
              await lock.release(lockKey, { id });
              this.logger.info(`=== Released lock ${id} ${key} ===`);
              resolve(result);
            } catch (err: any) {
              console.log({ err: err.errors || err });
              await lock.release(lockKey, { id });
              this.logger.info(`=== Released lock (error) ${id} ${key} ===`);
              reject(err);
            }
          })
          .catch((err: any) => {
            this.logger.info(`=== Failed to acquire lock ${lockKey} ===`);
            reject(err);
          });
      });
    });
  }
}
