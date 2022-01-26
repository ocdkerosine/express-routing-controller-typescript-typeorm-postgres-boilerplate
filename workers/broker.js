// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const lm = require('live-mutex');
const Logger = require('../utils/logger');

const logger = new Logger.LoggerService(__filename);

Promise.all([new lm.Broker(Object.freeze({ port: 6972, host: '0.0.0.0' })).ensure()]).then(function ([b]) {
  b.emitter.on('warning', function () {
    // eslint-disable-next-line prefer-rest-params
    logger.warn('BrokerError: ', ...arguments);
  });
});
