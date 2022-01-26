import { getOsEnvArray, getOsEnv } from '../../src/utils/env';
import { DBNamingStrategy } from '../../src/database/configuration/NamingStrategy';
import env from '../../src/env';

export = [
  {
    url: env.db.url,
    type: env.db.type,
    host: env.db.host,
    database: env.db.database,
    username: env.db.username,
    password: env.db.password,
    entities: getOsEnvArray('TYPEORM_ENTITIES'),
    migrations: getOsEnvArray('TYPEORM_MIGRATIONS'),
    namingStrategy: new DBNamingStrategy(),
    cli: {
      migrationsDir: getOsEnv('TYPEORM_MIGRATIONS_DIR'),
      entitiesDir: getOsEnv('TYPEORM_ENTITIES_DIR'),
    },
    logging: ['query'],
    synchronize: false,
    seeds: getOsEnvArray('TYPEORM_SEEDING_SEEDS'),
    factories: getOsEnvArray('TYPEORM_SEEDING_FACTORIES'),
  },
];
