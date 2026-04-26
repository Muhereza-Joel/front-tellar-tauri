import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tenants = sqliteTable("tenants", {
  uuid: text().primaryKey().notNull().unique(),
  name: text().notNull(),
  code: text().notNull(),
  slug: text().notNull().unique(),
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
