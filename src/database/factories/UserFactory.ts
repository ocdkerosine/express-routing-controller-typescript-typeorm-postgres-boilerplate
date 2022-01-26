import Faker from '@faker-js/faker';
import { define } from 'typeorm-seeding';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../api/entities/user.entity';

define(User, (faker: typeof Faker) => {
  const gender = faker.random.number(1);
  const firstName = faker.name.firstName(gender);
  const lastName = faker.name.lastName(gender);
  const email = faker.internet.email(firstName, lastName);

  const user = new User();
  user.id = uuidv4();
  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;
  user.password = 'q1w2e3r4';
  return user;
});
