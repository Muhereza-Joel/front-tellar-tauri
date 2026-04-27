"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getJwt } from "../lib/license";
import { useNotification } from "../hooks/useNotification";
import { useAuth } from "../context/AuthContext";
import {
  RefreshCw,
  Loader2,
  ChevronDown,
  X,
  CheckCircle2,
  Cloud,
} from "lucide-react";

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
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    currentTable: string;
    percent: number;
    status: "connecting" | "syncing" | "done" | "idle";
  } | null>(null);

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
    // Initial "Contacting Server" state
    setSyncProgress({
      currentTable: tableName === "all" ? "All Data" : tableName,
      percent: 10,
      status: "connecting",
    });

    try {
      const jwt = await getJwt();
      if (!jwt) {
        throw new Error("No valid JWT found. Please activate the license.");
      }

      // Small delay to show the connection state (optional, for UX)
      await new Promise((resolve) => setTimeout(resolve, 600));

      setSyncProgress((prev) =>
        prev ? { ...prev, percent: 40, status: "syncing" } : null,
      );

      let result: SyncResult;

      if (tableName === "all") {
        const lastPulled = getStoredTimestamp("last_sync_timestamp");
        result = await invoke<SyncResult>("sync_all", {
          jwt,
          tenantUuid: tenantId,
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
          tenantUuid: tenantId,
          tableName,
          lastPulledAt: lastPulled,
        });

        if (result.success && result.new_timestamp) {
          setStoredTimestamp(storageKey, result.new_timestamp);
        }
      }

      if (result.success) {
        setSyncProgress((prev) =>
          prev ? { ...prev, percent: 100, status: "done" } : null,
        );
        success(result.message);
        await fetchUnsyncedCounts();
      } else {
        setSyncProgress(null);
        error(result.message);
      }
    } catch (err: any) {
      setSyncProgress(null);
      error(err.message || "Sync failed unexpectedly");
    } finally {
      setLoading(false);
      // Auto-clear progress status after 4 seconds
      setTimeout(() => {
        setSyncProgress((prev) => (prev?.status === "done" ? null : prev));
      }, 4000);
    }
  };

  const totalUnsynced = Object.values(unsyncedCounts).reduce(
    (sum, c) => sum + c,
    0,
  );

  const ITEMS_PER_COL = 8;
  const columnCount = Math.ceil(SYNCABLE_TABLES.length / ITEMS_PER_COL);

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

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden ${gridColsClass}`}
        >
          {/* Header */}
          <div className="col-span-full bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center px-4 py-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
              Manual Synchronization
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* All Sync Action */}
          <div className="col-span-full">
            <button
              onClick={() => performSync("all")}
              disabled={loading}
              className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors flex justify-between items-center disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading && syncProgress?.currentTable === "All Data" ? "animate-spin" : ""}`}
                />
                <span>Sync Everything</span>
              </div>
              {totalUnsynced > 0 && (
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                  {totalUnsynced} Pending
                </span>
              )}
            </button>
          </div>

          {/* Table Grid */}
          <div className={`grid ${gridColsClass.split(" ")[0]} gap-x-1 p-2`}>
            {SYNCABLE_TABLES.map((table) => {
              const tableCount = unsyncedCounts[table] || 0;
              const isTableSyncing =
                syncProgress?.currentTable === table &&
                (syncProgress.status === "syncing" ||
                  syncProgress.status === "connecting");

              return (
                <button
                  key={table}
                  onClick={() => performSync(table)}
                  disabled={loading}
                  className={`group flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-all disabled:opacity-50 ${
                    isTableSyncing
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="capitalize group-hover:text-zinc-900 dark:group-hover:text-zinc-100 truncate pr-2">
                    {table.replace("_", " ")}
                  </span>
                  {isTableSyncing ? (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  ) : (
                    tableCount > 0 && (
                      <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded font-medium border border-red-100 dark:border-red-900/50">
                        {tableCount}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </div>

          {/* Progress Bar - BOTTOM SECTION */}
          {syncProgress && (
            <div className="col-span-full p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between items-center text-[10px] mb-2 font-medium">
                <div className="flex items-center gap-1.5">
                  {syncProgress.status === "connecting" && (
                    <Cloud className="h-3 w-3 text-blue-400 animate-pulse" />
                  )}
                  {syncProgress.status === "syncing" && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  {syncProgress.status === "done" && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}

                  <span
                    className={
                      syncProgress.status === "done"
                        ? "text-green-600"
                        : syncProgress.status === "connecting"
                          ? "text-blue-400"
                          : "text-zinc-500"
                    }
                  >
                    {syncProgress.status === "connecting" &&
                      "Contacting server..."}
                    {syncProgress.status === "syncing" &&
                      `Syncing ${syncProgress.currentTable.replace("_", " ")}...`}
                    {syncProgress.status === "done" && "Successfully synced"}
                  </span>
                </div>
                <span className="text-zinc-400 font-mono">
                  {syncProgress.percent}%
                </span>
              </div>

              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-in-out ${
                    syncProgress.status === "done"
                      ? "bg-green-500"
                      : syncProgress.status === "connecting"
                        ? "bg-blue-400"
                        : "bg-blue-600"
                  }`}
                  style={{ width: `${syncProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
