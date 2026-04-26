import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  uuid: text().primaryKey().notNull().unique(),
  branch_id: text(),
  parent_id: text(),
  name: text().notNull().unique(),
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
