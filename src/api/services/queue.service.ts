import { Service } from 'typedi';
import amqp, { Channel, ConsumeMessage } from 'amqplib';
import { Logger, LoggerService } from '@utils/logger';
import { QUEUE_NAMES } from '@constants/queue.constant';
import { delay } from '@utils/util';
import env from '@/env';

@Service()
export class QueueService {
  static channel: Channel;

  constructor(@Logger(__filename) private logger: LoggerService) {}

  private getQueueName(name: string) {
    return `${env.rabbitmq.queuePrefix}-${name}`;
  }

  private async createChannel(): Promise<Channel> {
    if (QueueService.channel) return QueueService.channel;
    this.logger.info(`ℹ️ Opening rabbitmq connection ${env.rabbitmq.url}`);
    const conn = await amqp.connect(env.rabbitmq.url);
    QueueService.channel = await conn.createChannel();
    this.logger.info(`✅ Rabbitmq connection opened & channel created`);
    return QueueService.channel;
  }

  public async publishMessage<T>(queueName: string, data: T, ttlSeconds = 0): Promise<void> {
    try {
      this.logger.info(`ℹ️ Sending message to queue ${queueName}`);
      const channel = await this.createChannel();
      if (ttlSeconds) await delay(ttlSeconds);
      channel.sendToQueue(this.getQueueName(queueName), Buffer.from(JSON.stringify(data)), {
        persistent: true,
      });
      this.logger.info(`✅ Message sent to queue ${queueName}`);
    } catch (error) {
      this.logger.error(JSON.stringify(error));
    }
  }

  public async consume(queueName: string, action: (channel: Channel, msg: ConsumeMessage) => Promise<void>): Promise<void> {
    const channel = await this.createChannel();
    const formattedQueueName = this.getQueueName(queueName);
    await channel.assertQueue(formattedQueueName, { durable: true });
    channel.prefetch(1);
    channel.consume(formattedQueueName, async msg => {
      await action(channel, msg);
    });
  }

  public async startConsuming(): Promise<void> {
    this.logger.info(`Waiting ${env.cron.delay} mins before consuming`);
    await delay(60 * env.cron.delay);
    this.logger.info(`ℹ️ Starting queue consumers...`);
    await this.createSomething();
  }

  private logConsumeError(err: any): void {
    err.response ? console.log('Queue consume', err.response.status, { err: err.response.data }) : console.log('Queue consume', { err });
  }

  public async destroy(): Promise<void> {
    if (QueueService.channel) {
      this.logger.info('Closing rabbitmq connection');
      QueueService.channel.close();
    }
  }

  public async createSomething(): Promise<void> {
    await this.consume(QUEUE_NAMES.DEAD_LETTER, async (channel, msg) => {
      // const event = JSON.parse(msg.content.toString());
      console.log('DOING SOMETHING');
      try {
        // await SOMETHING
        channel.ack(msg);
      } catch (err) {
        this.logConsumeError(err);
        channel.ack(msg);
      }
    });
  }
}
