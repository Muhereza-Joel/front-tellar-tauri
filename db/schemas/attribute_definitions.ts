import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * ATTRIBUTE DEFINITIONS
 * This table allows the user to "extend" the product model without database migrations.
 * A Hardware store might add "Material", while a Pharmacy adds "Expiry Date".
 */
export const attributeDefinitions = sqliteTable("attribute_definitions", {
  uuid: text().primaryKey().notNull(),

  // The display name of the field (e.g., "Color", "Voltage", "Batch Number")
  label: text().notNull(),
  branch_id: text(),

  // The type of input to show in the UI (e.g., "text", "number", "date", "select")
  fieldType: text().notNull().default("text"),

  // Validation and UI hints
  isRequired: integer({ mode: "boolean" }).default(false),
  placeholder: text(),

  // For 'select' types, store options as a JSON array: ["Red", "Blue", "Green"]
  options: text("options", { mode: "json" }).$type<string[]>(),

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
