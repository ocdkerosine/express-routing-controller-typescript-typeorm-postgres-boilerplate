import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';
import { User } from '@entities/user.entity';

export class CreateUsers implements Seeder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(factory: Factory, _connection: Connection): Promise<void> {
    await factory(User)().seedMany(2);
  }
}
