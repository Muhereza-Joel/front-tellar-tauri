"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  UserPlus,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Building2,
  CloudDownload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Cloud,
} from "lucide-react";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useSetupViewModel } from "./useSetupViewModel";
import UpdateNotification from "../components/UpdateNotification";

export default function SetupPage() {
  const { loading, errors, initializeSystem, restoreSystem, restoreProgress } =
    useSetupViewModel();
  const [setupMode, setSetupMode] = useState<"new" | "restore">("new");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organization: "",
    age: "",
    tenantId: "",
  });

  const inputStyle = (errorKey: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-1.5 text-sm outline-none transition-all
    ${
      errors[errorKey]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupMode === "new") {
      await initializeSystem(formData);
    } else {
      await restoreSystem(formData.tenantId);
    }
  };

  const isRestoring =
    loading && setupMode === "restore" && restoreProgress !== null;

  return (
    <div className="h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col overflow-hidden">
      <header className="flex w-full items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-black shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">Smart POS</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
              Terminal Initialization • v1.0.4
            </p>
          </div>
        </div>
        <UpdateNotification />
        <ThemeSwitcher />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-1.5">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-blue-500 shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              System Initialization
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {setupMode === "new"
                ? "Create a new organization and master account."
                : "Restore existing data using your Tenant ID."}
            </p>
          </div>

          {/* Mode Toggle (disabled during restore) */}
          <div className="flex gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <button
              type="button"
              onClick={() => setSetupMode("new")}
              disabled={loading}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                setupMode === "new"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              } disabled:opacity-50`}
            >
              New Setup
            </button>
            <button
              type="button"
              onClick={() => setSetupMode("restore")}
              disabled={loading}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                setupMode === "restore"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              } disabled:opacity-50`}
            >
              Restore Existing
            </button>
          </div>

          {/* Warning when new setup is selected */}
          {setupMode === "new" && !loading && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-2.5 border border-amber-200 dark:border-amber-800 flex gap-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-amber-700 dark:text-amber-300">
                <span className="font-semibold">Data Loss Risk:</span> Creating
                a new setup will disconnect you from any existing tenant data.
                All previous records will be inaccessible from this device.
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-black"
          >
            {errors.form && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-2 text-xs text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                {errors.form}
              </div>
            )}

            {!isRestoring ? (
              setupMode === "new" ? (
                <>
                  {/* Organization Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                      Organization Name
                    </label>
                    <div className="relative">
                      <Building2
                        className="absolute left-3 top-2 text-zinc-400"
                        size={14}
                      />
                      <input
                        required
                        type="text"
                        placeholder="e.g. Moels Group"
                        className={`${inputStyle("organization")} pl-8 py-1.5`}
                        value={formData.organization}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            organization: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Administrator Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                      Administrator Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-2 text-zinc-400"
                        size={14}
                      />
                      <input
                        required
                        type="text"
                        placeholder="e.g. John Doe"
                        className={`${inputStyle("name")} pl-8 py-1.5`}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                      Root Email (Login ID)
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-2 text-zinc-400"
                        size={14}
                      />
                      <input
                        required
                        type="email"
                        placeholder="admin@fronttela.com"
                        className={`${inputStyle("email")} pl-8 py-1.5`}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                      Master Key (Password)
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-2 text-zinc-400"
                        size={14}
                      />
                      <input
                        required
                        type="password"
                        placeholder="••••••••"
                        className={`${inputStyle("password")} pl-8 py-1.5`}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                      {errors.password && (
                        <p className="text-[10px] text-red-500 mt-0.5">
                          {errors.password}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Restore Mode: Tenant ID Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                      Existing Tenant ID
                    </label>
                    <div className="relative">
                      <Building2
                        className="absolute left-3 top-2 text-zinc-400"
                        size={14}
                      />
                      <input
                        required
                        type="text"
                        placeholder="e.g. 0195abc7-..."
                        className={`${inputStyle("tenantId")} pl-8 py-1.5 font-mono text-xs`}
                        value={formData.tenantId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tenantId: e.target.value.trim(),
                          })
                        }
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Enter the Tenant UUID you received during first setup.
                    </p>
                  </div>

                  {/* Restore info */}
                  <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-2 border border-blue-200 dark:border-blue-800">
                    <p className="text-[10px] text-blue-700 dark:text-blue-300">
                      <strong>Restores:</strong> products, customers, sales,
                      purchases, branches, users, roles. Permissions are
                      automatically recreated.
                    </p>
                  </div>
                </>
              )
            ) : (
              /* Progress Bar during restore */
              <div className="space-y-3 py-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    {restoreProgress.status === "connecting" && (
                      <Cloud className="h-4 w-4 text-blue-400 animate-pulse" />
                    )}
                    {restoreProgress.status === "syncing" && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {restoreProgress.status === "finalizing" && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {restoreProgress.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    <span className="font-medium">
                      {restoreProgress.message}
                    </span>
                  </div>
                  <span className="text-zinc-400 font-mono">
                    {restoreProgress.percent}%
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-in-out ${
                      restoreProgress.status === "done"
                        ? "bg-green-500"
                        : restoreProgress.status === "connecting"
                          ? "bg-blue-400"
                          : "bg-blue-600"
                    }`}
                    style={{ width: `${restoreProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm text-sm disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  {setupMode === "restore" ? (
                    <>
                      <CloudDownload size={16} className="animate-pulse" />
                      Restoring...
                    </>
                  ) : (
                    "Initializing..."
                  )}
                </span>
              ) : (
                <>
                  {setupMode === "restore" ? (
                    <>
                      <CloudDownload size={16} />
                      Restore & Continue
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Finalize Setup
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          <footer className="text-center pb-1">
            <p className="text-[9px] text-zinc-500 dark:text-zinc-500 uppercase tracking-tighter">
              Powered By Moels Group
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
