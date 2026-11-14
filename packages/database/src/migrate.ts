import {
  closeDatabase,
  createDatabase,
} from './database';
import { createMigrator } from './migration.provider';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const db = createDatabase({
    connectionString,
    maxConnections: 2,
  });

  try {
    const migrator = createMigrator(db);
    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((result) => {
      console.log(`${result.status}: ${result.migrationName}`);
    });

    if (error) {
      throw error;
    }
  } finally {
    await closeDatabase(db);
  }
}

void main().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});