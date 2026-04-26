import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const serviceVariants = sqliteTable("service_variants", {
  uuid: text().primaryKey().notNull(),
  branch_id: text(),
  service_id: text().notNull(), // references services.uuid
  sku: text().unique(), // optional SKU for the variant
  name: text().notNull(), // e.g., "Standard", "Premium", "2 hours"
  description: text(),

  // Override pricing
  price_adjustment: real().default(0), // can be positive or negative (relative to base_price)
  absolute_price: real(), // if set, overrides base_price entirely

  // Variant‑specific duration (e.g., 120 minutes instead of the default 60)
  duration_minutes: integer(),

  // Rental overrides
  deposit_required: real(),
  rental_rate_unit: text(),
  late_fee_per_unit: real(),

  // Stock‑like concept for services that have limited capacity (e.g., only 5 available seats)
  available_quantity: integer().default(0), // -1 for unlimited
  minimum_stock_level: integer().default(0),

  // System
  is_active: integer({ mode: "boolean" }).default(true),
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
