import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@entities/user.entity';

export class CreateBruce implements Seeder {
  async run(_factory: Factory, connection: Connection): Promise<void> {
    const em = connection.createEntityManager();

    const user = new User();
    user.id = uuidv4();
    user.firstName = 'Bruce';
    user.lastName = 'Wayne';
    user.email = 'bruce.wayne@wayne-enterprises.com';
    user.password = 'q1w2e3r4';

    await em.save(user);
  }
}
