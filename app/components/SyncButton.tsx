"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getJwt } from "../lib/license";
import { useNotification } from "../hooks/useNotification";
import { RefreshCw, Loader2, ChevronDown } from "lucide-react";

const SYNCABLE_TABLES = [
  "tenants",
  "local_roles",
  "local_users",
  "brands",
  "branches",
  "categories",
  "customers",
  "services",
  "service_variants",
  "units",
  "products",
  "attribute_definitions",
  "product_variants",
  "purchase_orders",
  "purchase_order_items",
  "suppliers",
  "sales",
  "sale_items",
  // Add more as your schema grows...
] as const;
type TableName = (typeof SYNCABLE_TABLES)[number];

interface SyncResult {
  success: boolean;
  message: string;
  new_timestamp?: number;
}

const getStoredTimestamp = (key: string): number | null => {
  const value = localStorage.getItem(key);
  return value ? Number(value) : null;
};

const setStoredTimestamp = (key: string, timestamp: number) => {
  localStorage.setItem(key, String(timestamp));
};

export function SyncButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unsyncedCounts, setUnsyncedCounts] = useState<Record<string, number>>(
    {},
  );

  const { success, error } = useNotification();

  const fetchUnsyncedCounts = async () => {
    try {
      const counts = await invoke<Record<string, number>>(
        "get_unsynced_counts",
      );
      setUnsyncedCounts(counts);
    } catch (err) {
      console.error("Failed to fetch unsynced counts:", err);
    }
  };

  useEffect(() => {
    fetchUnsyncedCounts();
    const interval = setInterval(fetchUnsyncedCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const performSync = async (tableName: TableName | "all") => {
    setLoading(true);
    setIsOpen(false);

    try {
      const jwt = await getJwt();
      if (!jwt) {
        throw new Error("No valid JWT found. Please activate the license.");
      }

      let result: SyncResult;

      if (tableName === "all") {
        const lastPulled = getStoredTimestamp("last_sync_timestamp");
        result = await invoke<SyncResult>("sync_all", {
          jwt,
          lastPulledAt: lastPulled,
        });
        if (result.success && result.new_timestamp) {
          setStoredTimestamp("last_sync_timestamp", result.new_timestamp);
        }
      } else {
        const storageKey = `last_sync_timestamp_${tableName}`;
        const lastPulled = getStoredTimestamp(storageKey);
        result = await invoke<SyncResult>("sync_table", {
          jwt,
          tableName,
          lastPulledAt: lastPulled,
        });
        if (result.success && result.new_timestamp) {
          setStoredTimestamp(storageKey, result.new_timestamp);
        }
      }

      if (result.success) {
        success(result.message);
        await fetchUnsyncedCounts();
      } else {
        error(result.message);
      }
    } catch (err: any) {
      error(err.message || "Sync failed unexpectedly");
    } finally {
      setLoading(false);
    }
  };

  const totalUnsynced = Object.values(unsyncedCounts).reduce(
    (sum, c) => sum + c,
    0,
  );

  // --- Layout Logic for 8 items per column ---
  const ITEMS_PER_COL = 8;
  const columnCount = Math.ceil(SYNCABLE_TABLES.length / ITEMS_PER_COL);

  // Dynamic CSS classes based on column count
  const gridColsClass =
    columnCount === 1
      ? "grid-cols-1 w-56"
      : columnCount === 2
        ? "grid-cols-2 w-[28rem]"
        : "grid-cols-3 w-[42rem]";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 relative"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        <span>Sync</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
        {totalUnsynced > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-zinc-950">
            {totalUnsynced}
          </span>
        )}
      </button>

      {isOpen && !loading && (
        <div
          className={`absolute right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden ${gridColsClass}`}
        >
          {/* Main Action Header */}
          <div className="col-span-full bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => performSync("all")}
              className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync Everything</span>
              </div>
              {totalUnsynced > 0 && (
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                  {totalUnsynced} Pending
                </span>
              )}
            </button>
          </div>

          {/* Dynamic Grid of Individual Tables */}
          <div className={`grid ${gridColsClass.split(" ")[0]} gap-x-1 p-2`}>
            {SYNCABLE_TABLES.map((table) => {
              const tableCount = unsyncedCounts[table] || 0;
              return (
                <button
                  key={table}
                  onClick={() => performSync(table)}
                  className="group flex justify-between items-center px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <span className="capitalize group-hover:text-zinc-900 dark:group-hover:text-zinc-100 truncate pr-2">
                    {table.replace("_", " ")}
                  </span>
                  {tableCount > 0 && (
                    <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded font-medium border border-red-100 dark:border-red-900/50">
                      {tableCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
