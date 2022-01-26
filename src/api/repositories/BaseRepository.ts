import { DeepPartial, EntityRepository, ObjectLiteral, Repository } from 'typeorm';

@EntityRepository()
export class BaseRepository<E extends ObjectLiteral> extends Repository<E> {
  public async add<T extends DeepPartial<E>>(data: T) {
    return await this.save(this.create(data));
  }
}
