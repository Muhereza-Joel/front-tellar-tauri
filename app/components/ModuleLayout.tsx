"use client";

import { useState } from "react";
import {
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "./ThemeSwitcher";

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SidebarGroup {
  groupHeader?: string;
  items: SidebarItem[];
}

export default function ModuleLayout({
  title,
  items,
  children,
}: {
  title: string;
  items: SidebarItem[] | SidebarGroup[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isGroupedLayout = (
    navItems: SidebarItem[] | SidebarGroup[],
  ): navItems is SidebarGroup[] => {
    return navItems.length > 0 && "items" in navItems[0];
  };

  const normalizedGroups: SidebarGroup[] = isGroupedLayout(items)
    ? items
    : [{ items: items }];

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar - Sharp Borders & High Density */}
      <aside
        className={`flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Module Header */}
        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between bg-zinc-50/50 dark:bg-zinc-900/20">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden animate-in fade-in duration-500">
              <div className="p-1.5 bg-blue-600 rounded-sm text-white shrink-0">
                <Terminal size={14} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white truncate">
                {title}
              </h2>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </div>

        {/* Global Exit */}
        <div className="px-3 py-4">
          <Link
            href="/"
            className={`flex items-center gap-3 px-2 py-2 text-[10px] font-black uppercase tracking-normal text-blue-950 dark:text-blue-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${isCollapsed ? "justify-center" : ""}`}
          >
            <ChevronLeft size={14} className={isCollapsed ? "" : "-ml-1"} />
            {!isCollapsed && <span>Return to Mainframe</span>}
          </Link>
        </div>

        {/* Navigation - High Density List */}
        <nav className="flex-1 overflow-y-auto space-y-4 py-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {normalizedGroups.map((group, groupIndex) => {
            if (group.items.length === 0) return null;

            return (
              <div key={groupIndex} className="space-y-0.5">
                {group.groupHeader && !isCollapsed && (
                  <div className="px-6 py-2 text-[9px] font-black tracking-[0.2em] text-zinc-700 uppercase dark:text-zinc-500">
                    {group.groupHeader}
                  </div>
                )}

                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 py-2.5 transition-all ${
                        isCollapsed ? "justify-center px-0" : "px-6"
                      } ${
                        isActive
                          ? "bg-blue-50/50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400"
                          : "text-black dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-0 h-full w-[2px] bg-blue-600" />
                      )}

                      <div
                        className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`}
                      >
                        {item.icon}
                      </div>

                      {!isCollapsed && (
                        <span
                          className={`text-xs font-bold uppercase tracking-tight truncate ${isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                        >
                          {item.label}
                        </span>
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-14 hidden group-hover:block z-50 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap uppercase tracking-widest border border-zinc-700">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 bg-zinc-50/30 dark:bg-zinc-900/10">
          <div
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
          >
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-tighter">
                  System Node
                </span>
                <span className="text-[10px] font-bold dark:text-zinc-200 font-mono">
                  127.0.0.1:POS
                </span>
              </div>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb Header for Content */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center px-8 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            <span>root</span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span>{title.toLowerCase().replace(/\s+/g, "_")}</span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-blue-500 font-bold">
              {pathname.split("/").pop()?.replace(/-/g, "_") || "dashboard"}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-zinc-50 dark:bg-black p-2 lg:p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
