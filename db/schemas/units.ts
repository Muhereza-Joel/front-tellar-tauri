import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const units = sqliteTable("units", {
  uuid: text().primaryKey().notNull().unique(),
  name: text().notNull(),
  singular: text().notNull(),
  plural: text().notNull(),
  description: text(),
  is_active: integer({ mode: "boolean" }).default(true),
  tenant_id: text(),
  created_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text(),
});
