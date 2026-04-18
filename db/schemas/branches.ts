import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const branches = sqliteTable("branches", {
  uuid: text().primaryKey().notNull().unique(),
  name: text().notNull(),
  email: text().unique(),
  phone: text(),
  address: text(),
  city: text(),
  country: text(),
  is_main: integer({ mode: "boolean" }).default(false),
  is_active: integer({ mode: "boolean" }).default(true),
  notes: text(),
  tenant_id: text(),
  created_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text(),
});
