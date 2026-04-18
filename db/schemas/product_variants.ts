import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const productVariants = sqliteTable("product_variants", {
  uuid: text().primaryKey().notNull(),
  product_id: text(),
  sku: text().unique(),
  barcode: text().unique(),
  selling_price: real().default(0),
  current_stock: real().default(0),
  minimum_stock_level: real().default(2),

  // Simplified attributes: No more JSON
  attribute_type: text(), // e.g., "Size", "Color", or "Weight"
  attribute_value: text(), // e.g., "XL", "Blue", or "500g"

  is_active: integer("is_active", { mode: "boolean" }).default(true),
  tenant_id: text(),
  created_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
