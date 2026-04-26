"use client";

import { useAuth } from "../app/context/AuthContext";
import {
  LogOut,
  User,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import ThemeSwitcher from "./components/ThemeSwitcher";
import { SyncButton } from "./components/SyncButton";

export default function Home() {
  const { logout, hasPermission } = useAuth();

  const canAccessInventory = hasPermission("inventory_module");
  const canAccessCustomers = hasPermission("customers_module");
  const canAccessSales = hasPermission("sales_module");
  const canAccessReports = hasPermission("reports_module");
  const canAccessAccounts = hasPermission("accounts_module");
  const canAccessSettings = hasPermission("settings_module");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Top Navigation Bar */}
      <header
        data-tauri-drag-region
        className="flex w-full items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-black dark:text-zinc-50">
              Smart POS
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              Terminal 01 • v1.0.4
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden flex-col items-end sm:flex">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">
              Active Operator
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {"Cashier"}
            </p>
          </div>

          <SyncButton />
          <ThemeSwitcher />

          <button
            onClick={() => logout()}
            className="group flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-all hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:hover:bg-red-950/30"
          >
            <LogOut
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-6 md:p-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Module Listing
          </h2>
          <p className="text-zinc-500">
            Please select a module to continue with FrontTella.
          </p>
        </div>

        {/* Dashboard Grid Actions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {canAccessInventory && (
            <MenuCard
              title="Inventory"
              icon={<Package size={32} />}
              href="/inventory"
              color="bg-emerald-600 hover:bg-emerald-700"
              description="Manage stock & products"
            />
          )}

          {canAccessCustomers && (
            <MenuCard
              title="Manage Customers"
              icon={<User size={32} />}
              href="/customer-management"
              color="bg-zinc-600 hover:bg-zinc-700"
              description="Manage your customers and services"
            />
          )}

          {canAccessSales && (
            <MenuCard
              title="Sales"
              icon={<ShoppingCart size={32} />}
              href="/sales"
              color="bg-blue-600 hover:bg-blue-700"
              description="Start a new transaction"
            />
          )}

          {canAccessReports && (
            <MenuCard
              title="Reports"
              icon={<BarChart3 size={32} />}
              href="/reports"
              color="bg-purple-600 hover:bg-purple-700"
              description="View sales analytics"
            />
          )}

          {canAccessAccounts && (
            <MenuCard
              title="User Accounts"
              icon={<User size={32} />}
              href="/user-management"
              color="bg-zinc-600 hover:bg-zinc-700"
              description="Manage users and permissions"
            />
          )}

          {canAccessSettings && (
            <MenuCard
              title="App Settings"
              icon={<Settings size={32} />}
              href="/app-settings"
              color="bg-zinc-600 hover:bg-zinc-700"
              description="Configure hardware & UI"
            />
          )}
        </div>
      </main>
    </div>
  );
}

// Helper component for cleaner code
function MenuCard({ title, icon, href, color, description }: any) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-start justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-zinc-200 transition-all hover:-translate-y-1 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800"
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-lg ${color}`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <div className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
          <span className="text-xs">→</span>
        </div>
      </div>
    </Link>
  );
}
