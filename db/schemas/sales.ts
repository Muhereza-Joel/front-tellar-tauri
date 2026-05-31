import { sql } from "drizzle-orm";
import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const sales = sqliteTable("sales", {
  uuid: text().primaryKey().notNull(),
  branch_id: text(),
  customer_id: text(),
  type: text().notNull().default("DIRECT"), // DIRECT or INVOICE
  status: text().notNull().default("COMPLETED"),
  discount_id: text(),
  discount_amount: real().default(0),
  total_amount: real().default(0).notNull(),
  amount_paid: real().default(0).notNull(),
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

export const saleItems = sqliteTable("sale_items", {
  uuid: text().primaryKey().notNull(),
  branch_id: text(),
  sale_id: text().notNull(),
  product_id: text().notNull(),
  variant_id: text(),
  quantity: real().notNull().default(1),
  unit_price: real().notNull(),
  subtotal: real().notNull(),
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
