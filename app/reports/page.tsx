"use client";

import ModuleLayout from "../components/ModuleLayout";
import { BarChart3, TrendingUp, Users, FileDown, Calendar } from "lucide-react";

export default function ReportsPage() {
  const sidebarItems = [
    {
      label: "Sales Overview",
      icon: <BarChart3 size={20} />,
      href: "/reports",
    },
    {
      label: "Performance",
      icon: <TrendingUp size={20} />,
      href: "/reports/performance",
    },
    {
      label: "Staff Activity",
      icon: <Users size={20} />,
      href: "/reports/staff",
    },
    {
      label: "Export Data",
      icon: <FileDown size={20} />,
      href: "/reports/export",
    },
  ];

  return (
    <ModuleLayout title="Reports" items={sidebarItems}>
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Daily Analytics</h2>
            <p className="text-sm text-zinc-500">
              Track your terminal performance.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-white border border-zinc-200 px-4 py-2 text-sm font-medium dark:bg-zinc-900 dark:border-zinc-800">
            <Calendar size={16} /> Last 24 Hours
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Placeholder for real data cards */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-500 uppercase">
              Net Revenue
            </p>
            <p className="text-2xl font-bold text-emerald-600">$0.00</p>
          </div>
        </div>

        <div className="h-64 flex items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-400 text-sm">
            Visual Chart Component (Recharts/Chart.js) goes here
          </p>
        </div>
      </div>
    </ModuleLayout>
  );
}
