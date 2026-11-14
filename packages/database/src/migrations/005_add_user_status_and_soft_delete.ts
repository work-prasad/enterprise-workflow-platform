
import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('status', 'varchar(20)', (column) =>
      column.notNull().defaultTo('ACTIVE'),
    )
    .execute();

  await db.schema
    .alterTable('users')
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  await db.schema
    .alterTable('users')
    .addCheckConstraint(
      'users_status_check',
      sql`status IN ('ACTIVE', 'DISABLED')`,
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropConstraint('users_status_check')
    .execute();

  await db.schema
    .alterTable('users')
    .dropColumn('deleted_at')
    .execute();

  await db.schema
    .alterTable('users')
    .dropColumn('status')
    .execute();
}
