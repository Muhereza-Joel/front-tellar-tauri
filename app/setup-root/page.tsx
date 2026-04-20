"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  UserPlus,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Hash,
  Building2, // new icon for organization
} from "lucide-react";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useSetupViewModel } from "./useSetupViewModel";
import UpdateNotification from "../components/UpdateNotification";

export default function SetupPage() {
  const { loading, errors, initializeSystem } = useSetupViewModel();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    organization: "", // new field
  });

  const inputStyle = (errorKey: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm outline-none transition-all
    ${
      errors[errorKey]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await initializeSystem(formData);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="flex w-full items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-black shadow-sm">
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

      <main className="flex flex-1 items-center justify-center p-6 md:p-10 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-blue-500 shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              System Initialization
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Create the master account and register your organization.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-md border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-black"
          >
            {errors.form && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                {errors.form}
              </div>
            )}

            {/* Organization Name (NEW) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                Organization Name
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-3 top-2.5 text-zinc-400"
                  size={14}
                />
                <input
                  required
                  type="text"
                  placeholder="e.g. Moels Group"
                  className={`${inputStyle("organization")} pl-9`}
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData({ ...formData, organization: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Administrator Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                Administrator Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-2.5 text-zinc-400"
                  size={14}
                />
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  className={`${inputStyle("name")} pl-9`}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                Root Email (Login ID)
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-2.5 text-zinc-400"
                  size={14}
                />
                <input
                  required
                  type="email"
                  placeholder="admin@fronttela.com"
                  className={`${inputStyle("email")} pl-9`}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Age Field */}
              <div className="space-y-1.5 hidden">
                <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                  Age
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-2.5 text-zinc-400"
                    size={14}
                  />
                  <input
                    required
                    type="number"
                    placeholder="25"
                    className={`${inputStyle("age")} pl-9`}
                    value={30}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1">
                  Master Key(Password)
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-2.5 text-zinc-400"
                    size={14}
                  />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className={`${inputStyle("password")} pl-9`}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  {errors.password && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm mt-4 text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  Initializing Terminal...
                </span>
              ) : (
                <>
                  <UserPlus size={18} />
                  Finalize Setup
                </>
              )}
            </button>
          </form>

          <footer className="text-center">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase tracking-tighter">
              Powered By Moels Group
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
