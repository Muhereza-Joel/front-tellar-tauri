import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  uuid: text().primaryKey().notNull().unique(),
  tenantId: text("tenant_id").notNull(),
  branchId: text("branch_id"),
  title: text("title").notNull(),
  category: text("category")
    .$type<"VEHICLE" | "CUSTOMER" | "SERVICE" | "GENERAL">()
    .notNull(),
  content: text("content").notNull(),
  referenceId: text("reference_id"), // Optional ID pointing to a specific Customer, Car/Vehicle ID, or Service Ticket
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

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
