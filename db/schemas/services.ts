import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const services = sqliteTable("services", {
  uuid: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  category_id: text(), // can reference same categories table as products
  brand_id: text(), // optional, for branded services

  // Pricing & Tax
  base_price: real().default(0), // default selling price
  tax_rate: real().default(0),
  is_tax_inclusive: integer({ mode: "boolean" }).default(true),

  // Service‑specific fields
  duration_minutes: integer(), // e.g., 60 for one hour
  requires_appointment: integer({ mode: "boolean" }).default(true),
  max_bookings_per_slot: integer().default(1), // for group services
  is_rental: integer({ mode: "boolean" }).default(false), // if it's a rental (e.g., vehicle, equipment)

  // Rental‑specific (only used if is_rental = true)
  deposit_required: real().default(0),
  rental_rate_unit: text(), // 'hour', 'day', 'week', 'month'
  late_fee_per_unit: real().default(0),

  // Availability (JSON or separate table – simple here)
  // e.g., { "monday": ["09:00-17:00"], "tuesday": [] }
  availability_schedule: text({ mode: "json" }).$type<
    Record<string, string[]>
  >(),

  // Metadata for any custom fields
  metadata: text({ mode: "json" }).$type<Record<string, any>>(),

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
});
