import {
  FileMigrationProvider,
  Migrator,
} from 'kysely';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DatabaseConnection } from './database';

export function createMigrator(
  db: DatabaseConnection,
): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });
}
