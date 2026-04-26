import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const brands = sqliteTable("brands", {
  uuid: text().primaryKey().notNull().unique(),
  branch_id: text(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
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
