import {
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  closeDatabase,
  createDatabase,
  type DatabaseConnection,
} from '@ewp/database';
import { DATABASE_CONNECTION } from './database.constants';

@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DatabaseConnection,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await closeDatabase(this.db);
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DatabaseConnection => {
        return createDatabase({
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
          maxConnections: config.get<number>('DB_POOL_MAX', 10),
        });
      },
    },
    DatabaseShutdown,
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}