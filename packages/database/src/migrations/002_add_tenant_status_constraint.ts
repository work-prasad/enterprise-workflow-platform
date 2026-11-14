import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('tenants')
    .addCheckConstraint(
      'tenants_status_check',
      sql`status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')`,
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('tenants')
    .dropConstraint('tenants_status_check')
    .execute();
}