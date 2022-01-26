import { Service } from 'typedi';
import NodeSchedule from 'node-schedule';
import env from '@/env';
import { delay } from '@utils/util';
import { Logger, LoggerService } from '@utils/logger';

@Service()
export class BackgroundService {
  constructor(@Logger(__filename) private logger: LoggerService) {}

  public async run() {
    this.logger.info(`Waiting ${env.cron.delay} mins before scheduling`);

    await delay(60 * env.cron.delay);

    this.logger.info(`Scheduling background jobs`);

    NodeSchedule.scheduleJob(env.cron.withdrawalProcess, async () => {
      // await something
    });
  }

  public async cancelAll() {
    for (const job in NodeSchedule.scheduledJobs) {
      NodeSchedule.cancelJob(job);
    }
  }
}
