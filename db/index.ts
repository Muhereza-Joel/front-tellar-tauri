// db/index.ts
"use client";

import { drizzle } from "drizzle-orm/sqlite-proxy";
import Database from "@tauri-apps/plugin-sql";
import * as schema from "./schemas";

let databasePromise: Promise<ReturnType<typeof drizzle>> | null = null;

export async function getDatabase() {
  if (!databasePromise) {
    const dbPath = "sqlite:local.db";
    databasePromise = Database.load(dbPath).then((sqlite) =>
      drizzle(
        async (sql, params) => {
          try {
            const isSelect = /^\s*SELECT\b/i.test(sql);

            if (isSelect) {
              const rows = await sqlite.select<any[]>(sql, params);
              return { rows: rows.map((row) => Object.values(row)) };
            } else {
              await sqlite.execute(sql, params);
              return { rows: [] };
            }
          } catch (e) {
            console.error("SQL Error:", e);
            return { rows: [] };
          }
        },
        { schema },
      ),
    );
  }
  return databasePromise;
}
