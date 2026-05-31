"use client";

import { useAuth } from "../app/context/AuthContext";
import {
  LogOut,
  User,
  ShoppingCart,
  Package,
  Settings,
  LayoutDashboard,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Users,
  Activity,
  Terminal,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import ThemeSwitcher from "./components/ThemeSwitcher";
import { SyncButton } from "./components/SyncButton";

interface SystemNotification {
  id: string;
  type: "info" | "warning" | "success";
  message: string;
  time: string;
}

const mockNotifications: SystemNotification[] = [
  {
    id: "1",
    type: "warning",
    message: "Low stock alert: 'Engine Oil 1L' (3 left).",
    time: "14:22:01",
  },
  {
    id: "2",
    type: "success",
    message: "Local transaction sync completed.",
    time: "14:10:45",
  },
  {
    id: "3",
    type: "info",
    message: "New service variant configuration deployed.",
    time: "13:00:12",
  },
];

export default function Home() {
  const { logout, hasPermission } = useAuth();

  const modules = [
    {
      id: "inventory",
      title: "Inventory",
      icon: <Package size={20} />,
      href: "/inventory",
      permission: "inventory_module",
      desc: "Stock & Suppliers",
    },
    {
      id: "customers",
      title: "Customers",
      icon: <Users size={20} />,
      href: "/customer-management",
      permission: "customers_module",
      desc: "Profiles & Records",
    },
    {
      id: "sales",
      title: "Sales",
      icon: <ShoppingCart size={20} />,
      href: "/sales",
      permission: "sales_module",
      desc: "POS Terminal",
    },
    {
      id: "expenses",
      title: "Expenses",
      icon: <Activity size={20} />,
      href: "/sales/expenses",
      permission: "expenses_module",
      desc: "Operational Costs",
    },
    {
      id: "reports",
      title: "Reports",
      icon: <Bell size={20} />,
      href: "/sales/reports",
      permission: "reports_module",
      desc: "Analytics & Insights",
    },
    {
      id: "accounts",
      title: "User Accounts",
      icon: <User size={20} />,
      href: "/user-management",
      permission: "accounts_module",
      desc: "Roles & Access",
    },
    {
      id: "settings",
      title: "Settings",
      icon: <Settings size={20} />,
      href: "/app-settings",
      permission: "settings_module",
      desc: "System Config",
    },
  ];

  const filteredModules = modules.filter((m) => hasPermission(m.permission));

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 font-sans dark:bg-black text-zinc-900 dark:text-zinc-300">
      {/* 1. SLIM SIDEBAR */}
      <aside className="flex w-16 flex-col items-center border-r border-zinc-200 bg-white py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-8 flex h-10 w-10 items-center justify-center rounded bg-blue-600 text-white">
          <Terminal size={22} />
        </div>
        <div className="flex flex-col gap-4">
          <SidebarIcon icon={<LayoutDashboard size={20} />} active />
          <SidebarIcon icon={<Activity size={20} />} />
        </div>
        <div className="mt-auto flex flex-col gap-4">
          <ThemeSwitcher />
          <button
            onClick={() => logout()}
            className="text-zinc-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 2. TOP BAR */}
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white uppercase">
              System Dashboard
            </h2>
            <span className="hidden h-4 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">
                Terminal 01 • v1.0.4 • Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SyncButton />
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-zinc-400">
                  Operator
                </p>
                <p className="text-xs font-bold dark:text-white">Cashier_01</p>
              </div>
              <div className="h-8 w-8 rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
            </div>
          </div>
        </header>

        {/* 3. MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12">
            {/* MODULE GRID */}
            <div className="lg:col-span-8">
              <section className="mb-6">
                <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  Operational Modules
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filteredModules.map((module) => (
                    <ModuleActionCard key={module.id} {...module} />
                  ))}
                </div>
              </section>
            </div>

            {/* SIDEBAR FEED */}
            <div className="lg:col-span-4">
              <section className="sticky top-0 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  System Telemetry
                </h3>

                <div className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between border-b border-zinc-100 p-3 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Bell size={14} className="text-blue-500" />
                      Notifications
                    </div>
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                      {mockNotifications.length}
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {mockNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex gap-3 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.type === "warning" && (
                            <AlertTriangle
                              size={14}
                              className="text-amber-500"
                            />
                          )}
                          {n.type === "success" && (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-500"
                            />
                          )}
                          {n.type === "info" && (
                            <Info size={14} className="text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-xs font-medium dark:text-zinc-200">
                            {n.message}
                          </p>
                          <p className="mt-1 font-mono text-[9px] uppercase text-zinc-400">
                            {n.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="#"
                    className="block border-t border-zinc-100 p-2 text-center text-[10px] font-bold uppercase text-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    View Full Audit Log
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Sub-components for cleaner structure
function SidebarIcon({
  icon,
  active = false,
}: {
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
        active
          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
      }`}
    >
      {icon}
    </button>
  );
}

function ModuleActionCard({
  title,
  icon,
  href,
  desc,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 border border-zinc-200 bg-white p-4 transition-all hover:border-blue-500/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-zinc-50 text-zinc-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
          {title}
        </h4>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{desc}</p>
      </div>
      <ChevronRight
        size={16}
        className="text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500"
      />

      {/* Sharp Accent Line on hover */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-600 transition-all group-hover:w-full" />
    </Link>
  );
}
