import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("tenant_memberships")
    .addColumn("id", "uuid", (column) =>
      column.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("tenant_id", "uuid", (column) =>
      column.notNull().references("tenants.id").onDelete("restrict"),
    )
    .addColumn("user_id", "uuid", (column) =>
      column.notNull().references("users.id").onDelete("restrict"),
    )
    .addColumn("role", "varchar(20)", (column) => column.notNull())
    .addColumn("status", "varchar(20)", (column) =>
      column.notNull().defaultTo("ACTIVE"),
    )
    .addColumn("created_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addUniqueConstraint("tenant_memberships_tenant_user_unique", [
      "tenant_id",
      "user_id",
    ])
    .addCheckConstraint(
      "tenant_memberships_role_check",
      sql`role IN ('ADMIN', 'MEMBER')`,
    )
    .addCheckConstraint(
      "tenant_memberships_status_check",
      sql`status IN ('ACTIVE', 'SUSPENDED')`
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("tenant_memberships").execute();
}
