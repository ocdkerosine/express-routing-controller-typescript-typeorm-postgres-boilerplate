// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Broker } from 'live-mutex';
import { LoggerService } from '@utils/logger';

const logger = new LoggerService(__filename);

Promise.all([new Broker(Object.freeze({ port: 6972, host: '0.0.0.0' })).ensure()]).then(function ([b]) {
  b.emitter.on('warning', function () {
    // eslint-disable-next-line prefer-rest-params
    logger.warn('BrokerError: ', ...arguments);
  });
});
