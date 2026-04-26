import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("local_users", {
  uuid: text().primaryKey().notNull().unique(),
  branch_id: text(),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
  is_email_verified: int().notNull().default(0),
  password: text().notNull(),
  role_id: text().notNull(),
  is_active: int().notNull().default(1),
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
