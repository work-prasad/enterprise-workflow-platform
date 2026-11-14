import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addCheckConstraint(
      'users_deleted_status_check',
      sql`deleted_at IS NULL OR status = 'DISABLED'`,
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropConstraint('users_deleted_status_check')
    .execute();
}