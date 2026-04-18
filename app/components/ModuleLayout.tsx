"use client";

import { useState } from "react";
import { ChevronLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "./ThemeSwitcher";

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

export default function ModuleLayout({
  title,
  items,
  children,
}: {
  title: string;
  items: SidebarItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-zinc-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4 flex flex-col gap-6">
          {/* TOP ROW: Back Button and Collapse Toggle */}
          <div
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
          >
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-500 dark:text-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <ChevronLeft size={18} />
              {!isCollapsed && <span>Back</span>}
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
          </div>

          {!isCollapsed && (
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 px-1 truncate animate-in fade-in slide-in-from-left-2">
              {title}
            </h2>
          )}
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 mt-2 overflow-y-auto space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center gap-3 py-3 text-sm font-bold transition-all border-l-4 ${
                  isCollapsed ? "justify-center px-0" : "px-5"
                } ${
                  isActive
                    ? "border-blue-600 text-blue-400 bg-blue-50/30 dark:bg-blue-900/10"
                    : "border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <div className={`shrink-0 ${isActive ? "text-blue-600" : ""}`}>
                  {item.icon}
                </div>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={`p-4 border-t border-zinc-100 dark:border-zinc-800 flex ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
        >
          <ThemeSwitcher />
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
