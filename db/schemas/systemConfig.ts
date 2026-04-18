import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const systemConfig = sqliteTable("system_config", {
  key: text().primaryKey().notNull(),
  value: text().notNull(),
  updated_at: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
