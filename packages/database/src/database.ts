
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

// Placeholder until we define our actual database tables.
export interface Database {}

export interface DatabaseConfig {
  connectionString: string;
  maxConnections: number;
}

export function createDatabase<DB extends object = Database>(
  config: DatabaseConfig,
): Kysely<DB> {
  if (!config.connectionString) {
    throw new Error('Database connection string is required');
  }

  if (!Number.isInteger(config.maxConnections) || config.maxConnections < 1) {
    throw new Error('maxConnections must be a positive integer');
  }

  const pool = new Pool({
    connectionString: config.connectionString,
    max: config.maxConnections,
  });

  const dialect = new PostgresDialect({
    pool,
  });

  return new Kysely<DB>({
    dialect,
  });
}

export async function closeDatabase<DB extends object>(
  db: Kysely<DB>,
): Promise<void> {
  await db.destroy();
}

export type DatabaseConnection<DB extends object = Database> = Kysely<DB>;