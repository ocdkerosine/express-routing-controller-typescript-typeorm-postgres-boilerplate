import env from '../../env';
import { Service } from 'typedi';
import { DBNamingStrategy } from './NamingStrategy';
import { Logger, LoggerService } from '@utils/logger';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';
import { Connection, createConnection, getConnectionManager } from 'typeorm';
import { getOsEnvArray, getOsEnv } from '@/utils/env';
import IPromise from 'bluebird';

// / interface DatabaseOptions {
//   url: string; host: string; type: string; database: string;
//   username: string; password: string; entityPrefix: string;
//   ssl: boolean; extra: { ssl: { rejectUnauthorized: boolean } }
// }

@Service()
export class Database {
  public options: any = {};
  private reconnectTry = 1;
  private reconnect_seconds = env.db.reconnectSeconds;
  private reconnect_max_try = env.db.maxTryReconnect;
  private connection: Connection;
  private syncOption = env.node === 'production' ? false : false;

  constructor(@Logger(__filename) private logger: LoggerService) {
    if (env.db.url) {
      this.options.url = env.db.url;
    } else {
      this.options.host = env.db.host;
      this.options.type = env.db.type;
      this.options.database = env.db.database;
      this.options.username = env.db.username;
      this.options.password = env.db.password;
    }
    if (env.db.ssl) {
      this.options.ssl = env.db.ssl;
      this.options.extra = {
        ssl: {
          rejectUnauthorized: false,
        },
      };
    }
  }

  private timeout = (ms: number) => {
    return new IPromise(resolve => setTimeout(resolve, ms));
  };

  /**
   * Setup database
   * @returns Promise with the operation result
   */
  public setupDatabase = async (): Promise<Connection> => {
    if (this.connection) return this.connection;
    try {
      this.connection = await createConnection(
        Object.assign(this.options, {
          entities: env.isDevelopment ? getOsEnvArray('TYPEORM_ENTITIES') : ['dist/api/entities/*.entity.js'],
          migrations: env.isDevelopment ? getOsEnvArray('TYPEORM_MIGRATIONS') : ['dist/database/migrations/*.js'],
          synchronize: this.syncOption,
          logging: false,
          cli: {
            migrationsDir: getOsEnv('TYPEORM_MIGRATIONS_DIR'),
            entitiesDir: getOsEnv('TYPEORM_ENTITIES_DIR'),
          },
          namingStrategy: new DBNamingStrategy(),
        }),
      );
      this.logger.info(`Connected to database (${this.options.database}) successfully`);
      return this.connection;
    } catch (err) {
      return await this.reloadDatabase(err as Error);
    }
  };

  /**
   * Try to reconnect to database
   * @param errorMsg - Error message from database
   */
  private reloadDatabase = async (err: Error): Promise<Connection> => {
    if (this.reconnectTry > this.reconnect_max_try) {
      throw err;
    }
    // we should try to reconnect a few times
    this.logger.warn(`Can't connect to ${this.options.database} database! Reason => ${err.message} Stack => ${err.stack}`);
    this.logger.warn(`Trying to reconnect in ${this.reconnect_seconds} seconds ` + `| ${this.reconnectTry}/${this.reconnect_max_try}`);
    this.reconnectTry = this.reconnectTry + 1;
    await this.timeout(this.reconnect_seconds * 1000);
    return this.setupDatabase();
  };

  /**
   * Get entities from database
   */
  public getDatabaseEntities = (
    connection: Connection,
  ): {
    name: string;
    tableName: string;
    m: RelationMetadata[];
  }[] => {
    return connection.entityMetadatas.map(x => ({
      name: x.name,
      tableName: x.tableName,
      m: x.relations,
    }));
  };

  /**
   * Clear entities from single database
   */
  public clearDatabaseEntities = async (connection: Connection) => {
    const entities = this.getDatabaseEntities(connection);
    try {
      for (const entity of entities) {
        const repository = connection.getRepository(entity.name);

        await repository.delete({});
      }
    } catch (error) {
      throw new Error(`ERROR: Cleaning test db: ${error}`);
    }
  };

  /**
   * Synchronize database
   */
  public synchronizeDatabase = (connection: Connection) => {
    return connection.synchronize(true);
  };

  /**
   * Run database migrations
   */
  public migrate = async (connection: Connection) => {
    this.logger.info(`Processing ${connection.migrations.length} database migrations on ${connection.options.database}`);
    const migrations = await connection.runMigrations();
    this.logger.info(`Executed ${migrations.length} database migrations on ${connection.options.database}`);
    return migrations;
  };

  /**
   * Initialize database
   */
  public initializeDatabase = async (): Promise<Connection> => {
    const connection = await this.setupDatabase();
    await this.migrate(connection);
    return connection;
  };

  /**
   * Get default connection for databases
   */
  public getConnection = async (): Promise<Connection> => {
    const connections = getConnectionManager().connections;
    if (connections.length) return connections[0];
    return await this.initializeDatabase();
  };

  /**
   * Stop databases
   */
  public stopDatabase = async (): Promise<void> => {
    try {
      if (!this.connection) return;
      await this.connection.close();
    } catch (error) {
      throw error;
    }
  };

  /**
   * Kill databases
   */
  public kill = async (): Promise<void> => {
    try {
      if (!this.connection) return;
      await this.clearDatabaseEntities(this.connection);
      await this.connection.close();
    } catch (error) {
      throw error;
    }
  };
}
