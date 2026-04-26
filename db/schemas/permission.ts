import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const permissions = sqliteTable("local_permissions", {
  uuid: text().primaryKey().notNull().unique(),
  name: text().notNull(),
  role_id: text(),
  tenant_id: text(),
  created_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text(),
  sync_status: text().default("created"),
});
