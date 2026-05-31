import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const serviceSales = sqliteTable("service_sales", {
  uuid: text().primaryKey().notNull(),
  customer_id: text(), // References your customers table
  type: text()
    .$type<"DIRECT" | "INVOICE" | "APPOINTMENT">()
    .default("DIRECT")
    .notNull(),
  status: text()
    .$type<"COMPLETED" | "PENDING" | "CANCELLED">()
    .default("COMPLETED")
    .notNull(),
  discount_id: text(),
  discount_amount: real().default(0),
  total_amount: real().default(0).notNull(),
  amount_paid: real().default(0).notNull(),

  // System Fields
  tenant_id: text(),
  branch_id: text(),
  sync_status: text().default("created"),
  created_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text(),
});

export const serviceSaleItems = sqliteTable("service_sale_items", {
  uuid: text().primaryKey().notNull(),
  service_sale_id: text().notNull(), // References serviceSales.uuid
  service_id: text().notNull(), // References services.uuid
  variant_id: text(), // References serviceVariants.uuid (nullable)
  quantity: integer().default(1).notNull(),
  unit_price: real().default(0).notNull(),
  subtotal: real().default(0).notNull(),

  // Rental specifics capturing dynamic snapshots
  is_rental: integer({ mode: "boolean" }).default(false),
  rental_unit: text(), // 'hour', 'day', 'week', 'month'
  deposit_captured: real().default(0),

  // System Fields
  branch_id: text(),
  tenant_id: text(),
  sync_status: text().default("created"),
  created_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
