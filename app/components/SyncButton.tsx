"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getJwt } from "../lib/license";
import { useNotification } from "../hooks/useNotification";
import { useAuth } from "../context/AuthContext";
import {
  RefreshCw,
  Loader2,
  X,
  CheckCircle2,
  Cloud,
  Database,
  Layers,
  History,
  Activity,
  ChevronRight,
} from "lucide-react";

const SYNCABLE_TABLES = [
  "tenants",
  "local_roles",
  "local_users",
  "brands",
  "branches",
  "categories",
  "units",
  "products",
  "services",
  "service_variants",
  "attribute_definitions",
  "product_variants",
  "customers",
  "purchase_orders",
  "purchase_order_items",
  "suppliers",
  "sales",
  "sale_items",
  "service_sales",
  "service_sale_items",
  "expenses",
  "discounts",
  "notes",
] as const;

type TableName = (typeof SYNCABLE_TABLES)[number];

// Logic grouping for a more professional layout
const TABLE_GROUPS = [
  {
    label: "Core Architecture",
    icon: <Database size={12} />,
    tables: ["tenants", "local_roles", "local_users", "brands", "branches"],
  },
  {
    label: "Product Catalog",
    icon: <Layers size={12} />,
    tables: [
      "categories",
      "units",
      "products",
      "services",
      "service_variants",
      "attribute_definitions",
      "product_variants",
      "discounts",
      "notes",
    ],
  },
  {
    label: "Operational Data",
    icon: <History size={12} />,
    tables: [
      "customers",
      "purchase_orders",
      "purchase_order_items",
      "suppliers",
      "sales",
      "sale_items",
      "service_sales",
      "service_sale_items",
      "expenses",
    ],
  },
];

interface SyncResult {
  success: boolean;
  message: string;
  new_timestamp?: number;
}

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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnsyncedCounts();
    const interval = setInterval(fetchUnsyncedCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const performSync = async (tableName: TableName | "all") => {
    setLoading(true);
    setSyncProgress({
      currentTable: tableName === "all" ? "Full Registry" : tableName,
      percent: 10,
      status: "connecting",
    });

    try {
      const jwt = await getJwt();
      if (!jwt) throw new Error("License Activation Required");

      await new Promise((r) => setTimeout(r, 400));
      setSyncProgress((prev) =>
        prev ? { ...prev, percent: 45, status: "syncing" } : null,
      );

      let result: SyncResult;
      if (tableName === "all") {
        const lastPulled = localStorage.getItem("last_sync_timestamp");
        result = await invoke<SyncResult>("sync_all", {
          jwt,
          tenantUuid: tenantId,
          lastPulledAt: lastPulled ? Number(lastPulled) : null,
        });
        if (result.success && result.new_timestamp)
          localStorage.setItem(
            "last_sync_timestamp",
            String(result.new_timestamp),
          );
      } else {
        const storageKey = `last_sync_timestamp_${tableName}`;
        const lastPulled = localStorage.getItem(storageKey);
        result = await invoke<SyncResult>("sync_table", {
          jwt,
          tenantUuid: tenantId,
          tableName,
          lastPulledAt: lastPulled ? Number(lastPulled) : null,
        });
        if (result.success && result.new_timestamp)
          localStorage.setItem(storageKey, String(result.new_timestamp));
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
      error(err.message || "Sync pipeline failure");
    } finally {
      setLoading(false);
      setTimeout(
        () =>
          setSyncProgress((prev) => (prev?.status === "done" ? null : prev)),
        3000,
      );
    }
  };

  const totalUnsynced = Object.values(unsyncedCounts).reduce(
    (sum, c) => sum + c,
    0,
  );

  return (
    <div className="relative">
      {/* TRIGGER BUTTON - Gauged Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-3 border px-3 py-1.5 transition-all ${
          isOpen
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
        }`}
      >
        <div className="relative">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {totalUnsynced > 0 && !loading && (
            <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-red-500" />
          )}
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-black uppercase tracking-widest">
            Data Sync
          </span>
          <span
            className={`font-mono text-[9px] ${isOpen ? "text-blue-100" : "text-zinc-400"}`}
          >
            {totalUnsynced} PENDING
          </span>
        </div>
      </button>

      {/* SYNC CONSOLE OVERLAY */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[520px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 z-[100]">
          {/* Console Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] dark:text-white">
                Synchronization Engine
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Console Actions */}
          <div className="p-4">
            <button
              onClick={() => performSync("all")}
              disabled={loading}
              className="group flex w-full items-center justify-between border border-blue-200 bg-blue-50/50 p-3 transition-all hover:bg-blue-600 hover:text-white dark:border-blue-900/30 dark:bg-blue-900/10"
            >
              <div className="flex items-center gap-3">
                <RefreshCw
                  size={16}
                  className={
                    loading && syncProgress?.currentTable === "Full Registry"
                      ? "animate-spin"
                      : ""
                  }
                />
                <div className="text-left">
                  <p className="text-xs font-bold uppercase">
                    Initialize Global Handshake
                  </p>
                  <p className="text-[10px] opacity-70">
                    Synchronize all delta changes across all tables
                  </p>
                </div>
              </div>
              <ChevronRight
                size={14}
                className="opacity-40 group-hover:translate-x-1 group-hover:opacity-100"
              />
            </button>

            {/* Table Grouping Grid */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              {TABLE_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <div className="flex items-center gap-1.5 border-b border-zinc-100 pb-1 dark:border-zinc-800">
                    <span className="text-zinc-400">{group.icon}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                      {group.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {group.tables.map((table) => {
                      const count = unsyncedCounts[table] || 0;
                      const isSyncing = syncProgress?.currentTable === table;
                      return (
                        <button
                          key={table}
                          disabled={loading}
                          onClick={() => performSync(table as TableName)}
                          className={`flex items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50 ${
                            isSyncing
                              ? "text-blue-500"
                              : "text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <span className="truncate pr-1">
                            {table.replace(/_/g, " ")}
                          </span>
                          {isSyncing ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            count > 0 && (
                              <span className="font-mono text-red-500">
                                {count}
                              </span>
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Progress Footer */}
          {syncProgress && (
            <div className="border-t border-zinc-200 bg-zinc-900 p-4 font-mono dark:border-zinc-800">
              <div className="mb-2 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  {syncProgress.status === "connecting" && (
                    <Cloud size={12} className="animate-pulse text-blue-400" />
                  )}
                  {syncProgress.status === "syncing" && (
                    <Loader2 size={12} className="animate-spin text-blue-500" />
                  )}
                  {syncProgress.status === "done" && (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  )}
                  <span className="uppercase text-zinc-300">
                    {syncProgress.status === "connecting" &&
                      ">> CONTACTING REMOTE..."}
                    {syncProgress.status === "syncing" &&
                      `>> PULLING_${syncProgress.currentTable.toUpperCase()}`}
                    {syncProgress.status === "done" &&
                      ">> SYNC_SEQUENCE_COMPLETE"}
                  </span>
                </div>
                <span className="text-blue-400">{syncProgress.percent}%</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    syncProgress.status === "done"
                      ? "bg-emerald-500"
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
