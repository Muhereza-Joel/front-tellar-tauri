import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const expenses = sqliteTable("expenses", {
  uuid: text().primaryKey().notNull().unique(),
  tenantId: text("tenant_id").notNull(),
  branchId: text("branch_id"),
  title: text("title").notNull(),
  category: text("category")
    .$type<
      | "OPEX"
      | "COGS"
      | "MARKETING"
      | "PAYROLL"
      | "CAPEX"
      | "TAX"
      | "UTILITIES"
      | "GENERAL"
    >()
    .notNull(),
  amount: real("amount").notNull(),
  expenseDate: text("expense_date").notNull(), // stored as YYYY-MM-DD for reliable SQL grouping
  paymentMethod: text("payment_method")
    .$type<"CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CREDIT">()
    .notNull(),
  vendor: text("vendor"),
  notes: text("notes"),
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

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
