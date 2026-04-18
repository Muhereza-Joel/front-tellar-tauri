import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * PRODUCTS
 * Core inventory table. Site-specific data lives in the 'metadata' JSON column.
 */
export const products = sqliteTable("products", {
  // 1. Primary Identification
  uuid: text().primaryKey().notNull(),
  sku: text().unique(),
  barcode: text(),

  // 2. Core Info
  name: text().notNull(),
  slug: text(),
  description: text(),
  brand_id: text(),

  // 3. Taxonomy
  category_id: text(), // User-defined categories (Stationery, Tools, etc.)

  // 4. Pricing & Tax
  buying_price: real().default(0),
  selling_price: real().default(0),
  tax_rate: real().default(0),
  is_tax_inclusive: integer({ mode: "boolean" }).default(true),

  // 5. Inventory Control
  uom: text().default("pcs"), // Unit of Measure (kg, meters, box)
  current_stock: real().default(0),
  minimum_stock_level: real().default(5),

  // 6. DYNAMIC METADATA
  // This stores values for the fields defined in attributeDefinitions.
  // Example: { "Material": "Steel", "Size": "12mm" }
  metadata: text("metadata", { mode: "json" }).$type<Record<string, any>>(),

  // 7. Status & System
  is_active: integer({ mode: "boolean" }).default(true),
  has_inventory: integer({ mode: "boolean" }).default(true),

  tenant_id: text(),
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text("deleted_at"),
});

export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;
