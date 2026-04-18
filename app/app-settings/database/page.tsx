"use client";

import {
  Download,
  ShieldCheck,
  FileJson,
  Table as TableIcon,
  HardDrive,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { useDatabaseViewModel } from "./useDatabaseViewModel";

/**
 * HELPER COMPONENTS
 * Defined outside to prevent re-mounting and focus loss
 */
const ActionCard = ({
  title,
  desc,
  icon: Icon,
  onClick,
  color = "blue",
  disabled,
}: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-500 transition-all text-left group disabled:opacity-50"
  >
    <div
      className={`p-3 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 rounded-lg group-hover:scale-110 transition-transform`}
    >
      <Icon size={20} />
    </div>
    <div>
      <p className="font-bold text-sm">{title}</p>
      <p className="text-[11px] text-zinc-500">{desc}</p>
    </div>
  </button>
);

const ToggleSwitch = ({ enabled, onClick, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`h-6 w-11 rounded-full transition-all duration-300 p-1 relative flex items-center ${
      enabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
    } ${disabled ? "opacity-50 cursor-wait" : ""}`}
  >
    <div
      className={`h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
        enabled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

export default function DatabaseSettingsPage() {
  const {
    dbConfig,
    togglingFields,
    isProcessing,
    isSaving,
    setDbConfig,
    toggleDbField,
    runBackup,
    exportData,
    saveDatabaseConfig,
  } = useDatabaseViewModel();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex justify-between items-center bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 sticky top-0 z-20 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">Database & Storage</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Manage local data, backups, and exports
          </p>
        </div>
        <button
          onClick={saveDatabaseConfig}
          disabled={isSaving || isProcessing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start px-4 lg:px-0">
        <div className="space-y-6">
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">
              Manual Operations
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <ActionCard
                title="Create Instant Backup"
                desc="Generate a snapshot of the current database"
                icon={HardDrive}
                onClick={runBackup}
                disabled={isProcessing}
              />
              <div className="grid grid-cols-2 gap-3">
                <ActionCard
                  title="Export Sales"
                  desc="Export to CSV"
                  icon={TableIcon}
                  onClick={() => exportData("Sales")}
                  color="emerald"
                  disabled={isProcessing}
                />
                <ActionCard
                  title="Export Products"
                  desc="Export to JSON"
                  icon={FileJson}
                  onClick={() => exportData("Products")}
                  color="purple"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">
              Automation Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Scheduled Backups</p>
                    <p className="text-[11px] text-zinc-500">
                      Automatically backup local database
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={dbConfig.autoBackup}
                  onClick={() => toggleDbField("autoBackup")}
                  disabled={togglingFields["autoBackup"]}
                />
              </div>

              {dbConfig.autoBackup && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Frequency (Days)
                    </label>
                    <input
                      type="number"
                      value={dbConfig.backupIntervalDays}
                      onChange={(e) =>
                        setDbConfig({
                          ...dbConfig,
                          backupIntervalDays: Number(e.target.value),
                        })
                      }
                      className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 font-bold py-1 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Retention Count
                    </label>
                    <input
                      type="number"
                      value={dbConfig.keepBackupCount}
                      onChange={(e) =>
                        setDbConfig({
                          ...dbConfig,
                          keepBackupCount: Number(e.target.value),
                        })
                      }
                      className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 font-bold py-1 outline-none text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">
              Backup History
            </h3>
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {[
                  {
                    name: "Backup_2023_10_27.sqlite",
                    size: "4.2 MB",
                    date: "Today, 04:00 AM",
                  },
                  {
                    name: "Backup_2023_10_26.sqlite",
                    size: "4.1 MB",
                    date: "Yesterday",
                  },
                  {
                    name: "Backup_2023_10_25.sqlite",
                    size: "3.9 MB",
                    date: "2 days ago",
                  },
                ].map((backup, i) => (
                  <div
                    key={i}
                    className="p-4 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Download size={16} className="text-zinc-400" />
                      <div>
                        <p className="text-xs font-bold">{backup.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {backup.date} • {backup.size}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 text-center">
                <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">
                  View All Backups
                </button>
              </div>
            </div>
          </section>

          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="text-emerald-600" size={18} />
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                Database Health: Optimized
              </p>
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/70 leading-relaxed">
              Your local SQLite database was last optimized 2 hours ago.
              Automatic vacuuming is enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
