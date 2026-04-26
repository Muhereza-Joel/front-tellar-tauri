import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

// 1. Purchase Orders (Header)
export const purchaseOrders = sqliteTable("purchase_orders", {
  uuid: text().primaryKey().notNull().unique(),
  branch_id: text(),
  po_number: text().notNull().unique(), // e.g., PO-2024-001
  vendor_uuid: text().notNull(),
  vendor_name: text().notNull(),

  // Status: 'DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'
  status: text().notNull().default("DRAFT"),

  // Dates stored as ISO strings
  issue_date: text().notNull(),
  expected_delivery_date: text(),

  // Financials
  subtotal: real().notNull().default(0.0),
  tax_amount: real().notNull().default(0.0),
  total_amount: real().notNull().default(0.0),

  notes: text(),

  // Multi-tenancy & Audit
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

// 2. Purchase Order Items (Lines)
export const purchaseOrderItems = sqliteTable("purchase_order_items", {
  uuid: text().primaryKey().notNull().unique(),
  purchase_order_uuid: text()
    .notNull()
    .references(() => purchaseOrders.uuid, { onDelete: "cascade" }),

  product_uuid: text().notNull(),
  product_name: text().notNull(),
  sku: text().notNull(),

  quantity: integer().notNull().default(1),
  received_quantity: integer().notNull().default(0),

  unit_price: real().notNull().default(0.0),
  total_price: real().notNull().default(0.0),
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

// Optional: Types for use in ViewModels
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
