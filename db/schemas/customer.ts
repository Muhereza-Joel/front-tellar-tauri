import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  uuid: text().primaryKey().notNull().unique(),
  first_name: text().notNull(),
  last_name: text().notNull(),
  date_of_birth: text(), // store as text (ISO string) or integer timestamp
  email: text().notNull().unique(),
  phone: text(),
  address: text(),
  city: text(),
  country: text(),
  loyalty_points: integer().default(0),
  credit_limit: real().default(0),
  balance: real().default(0),
  is_active: integer({ mode: "boolean" }).default(true),
  is_walk_in: integer({ mode: "boolean" }).default(false),
  notes: text(),
  last_purchase_at: text(), // or integer timestamp
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
