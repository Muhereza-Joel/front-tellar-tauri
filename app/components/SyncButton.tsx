"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getJwt } from "../lib/license";
import {
  RefreshCw,
  Loader2,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";

const SYNCABLE_TABLES = ["tenants", "customers"] as const;
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
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [unsyncedCounts, setUnsyncedCounts] = useState<Record<string, number>>(
    {},
  );

  // Fetch unsynced counts from backend
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

  // Initial fetch and periodic refresh (every 30 seconds)
  useEffect(() => {
    fetchUnsyncedCounts();
    const interval = setInterval(fetchUnsyncedCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const performSync = async (tableName: TableName | "all") => {
    setLoading(true);
    setStatus(null);
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
        setStatus({ type: "success", msg: result.message });
        // Refresh counts after successful sync
        await fetchUnsyncedCounts();
      } else {
        setStatus({ type: "error", msg: result.message });
      }
    } catch (err: any) {
      setStatus({
        type: "error",
        msg: err.message || "Sync failed unexpectedly",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 5000);
    }
  };

  // Compute total unsynced count
  const totalUnsynced = Object.values(unsyncedCounts).reduce(
    (sum, c) => sum + c,
    0,
  );

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
        <ChevronDown className="h-4 w-4" />
        {totalUnsynced > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalUnsynced}
          </span>
        )}
      </button>

      {isOpen && !loading && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => performSync("all")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex justify-between items-center"
            >
              <span>Sync All Tables</span>
              {totalUnsynced > 0 && (
                <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs px-2 py-0.5 rounded-full">
                  {totalUnsynced}
                </span>
              )}
            </button>
            <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />
            {SYNCABLE_TABLES.map((table) => {
              const tableCount = unsyncedCounts[table] || 0;
              return (
                <button
                  key={table}
                  onClick={() => performSync(table)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors capitalize flex justify-between items-center"
                >
                  <span>{table.replace("_", " ")}</span>
                  {tableCount > 0 && (
                    <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs px-2 py-0.5 rounded-full">
                      {tableCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {status && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              status.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{status.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
