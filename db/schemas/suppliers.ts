import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const suppliers = sqliteTable("suppliers", {
  uuid: text().primaryKey().notNull(),
  // Identification & Details
  name: text().notNull(),
  contact_person: text(),
  email: text(),
  phone: text(),
  alternative_phone: text(),
  website: text(),

  // Address Information
  address: text(),
  city: text(),
  state: text(),
  country: text(),
  postal_code: text(),

  // Business & Tax Info
  tax_id: text(),
  registration_number: text(),

  // Payment & Credit
  payment_terms: text(), // e.g., "Net 30"
  credit_limit: real().default(0),
  payment_days: integer().default(0),

  // Banking Details
  bank_name: text(),
  bank_account_name: text(),
  bank_account_number: text(),
  bank_branch: text(),

  // Status & Flags
  is_active: integer({ mode: "boolean" }).notNull().default(true),
  is_preferred: integer({ mode: "boolean" }).notNull().default(false),
  rating: integer().default(0),
  notes: text(),

  // System Fields
  tenant_id: text(),
  created_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deleted_at: text(),
});

export type Supplier = InferSelectModel<typeof suppliers>;
export type NewSupplier = InferInsertModel<typeof suppliers>;
