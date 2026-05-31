import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const discounts = sqliteTable("discounts", {
  uuid: text().primaryKey().notNull().unique(),
  tenantId: text("tenant_id").notNull(),
  branchId: text("branch_id"),
  name: text("name").notNull(),
  type: text("type").$type<"PERCENTAGE" | "FIXED">().notNull(),
  value: real("value").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text(),
  sync_status: text().default("created"),
});

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;
