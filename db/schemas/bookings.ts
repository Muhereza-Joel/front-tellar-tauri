import { sql } from "drizzle-orm";
import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const appointments = sqliteTable("bookings", {
  uuid: text().primaryKey().notNull(),
  branch_id: text(),
  service_id: text().notNull(), // which service
  variant_id: text(), // optional variant
  customer_id: text(), // reference to your customers table
  start_time: text().notNull(), // ISO datetime
  end_time: text().notNull(),
  status: text().default("scheduled"), // scheduled, completed, cancelled, no-show
  price: real().notNull(), // final price at booking time
  deposit_paid: real().default(0),
  notes: text(),
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
