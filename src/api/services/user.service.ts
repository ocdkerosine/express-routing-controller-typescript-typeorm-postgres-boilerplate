import { Service } from 'typedi';
import { Logger, LoggerService } from '@utils/logger';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { User } from '@entities/user.entity';
import { USER_RESPONSES } from '@constants/user.constant';
import { BadRequestError } from '@errors/BadRequestError';
import { Repository } from 'typeorm';
import { ICreateUser } from '@interfaces/user.interface';

@Service()
export class UserService {
  constructor(@Logger(__filename) private logger: LoggerService, @InjectRepository(User) private userRepository: Repository<User>) {}

  public async create(body: ICreateUser): Promise<User> {
    this.logger.info('ℹ️ Creating new user => ', body);
    const user = await this.userRepository.save(this.userRepository.create(body));
    this.logger.info('✅ User created');
    return user;
  }

  public async update(id: string, body: Partial<User>) {
    this.logger.info('ℹ️ Updating user => ', body);
    if (body.password) body.password = await User.hashPassword(body.password);
    await this.userRepository.save({ ...body, id });
    const user = this.userRepository.findOne(id);
    this.logger.info('✅ User updated');
    return user;
  }

  public async createUser(body: ICreateUser): Promise<User> {
    const userCount = await this.countUserByEmail(body.email);
    if (userCount !== 0) throw new BadRequestError({ message: USER_RESPONSES.EMAIL_ALREADY_EXISTS, property: 'email' });
    const newUser = await this.create(body);
    return newUser;
  }

  async getUserById(id: string): Promise<User> {
    this.logger.info('ℹ️ Get user by id => ', id);
    const user = await this.userRepository.findOne({ id });
    this.logger.info('✅ User retrieved');
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    this.logger.info('ℹ️ Get user by email => ', email);
    const user = this.userRepository.findOne({ email: email.toLowerCase() });
    this.logger.info('✅ User retrieved');
    return user;
  }

  async countUserById(id: string): Promise<number> {
    this.logger.info('ℹ️ Count user by email => ', id);
    const count = this.userRepository.count({ id });
    this.logger.info('✅ Count retrieved');
    return count;
  }

  async countUserByEmail(email: string): Promise<number> {
    this.logger.info('ℹ️ Count user by email => ', email);
    const count = this.userRepository.count({ email: email.toLowerCase() });
    this.logger.info('✅ Count retrieved');
    return count;
  }
}
