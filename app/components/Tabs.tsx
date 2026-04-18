// components/Tabs.tsx
import React from "react";

export type TabItem = {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
};

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "default" | "underlined" | "pills";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  className = "",
}) => {
  const variantStyles = {
    default: {
      container: "flex gap-1 border-b border-zinc-200 dark:border-zinc-800",
      button: (isActive: boolean) =>
        `flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-t-md transition-all ${
          isActive
            ? "bg-white dark:bg-black text-blue-400 border-x border-t border-zinc-200 dark:border-zinc-800"
            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`,
    },
    underlined: {
      container: "flex gap-4 border-b border-zinc-200 dark:border-zinc-800",
      button: (isActive: boolean) =>
        `pb-2 text-sm font-medium transition-all ${
          isActive
            ? "text-blue-400 border-b-2 border-blue-600 -mb-px"
            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`,
    },
    pills: {
      container: "flex flex-wrap gap-2",
      button: (isActive: boolean) =>
        `px-4 py-2 text-sm font-medium rounded-full transition-all ${
          isActive
            ? "bg-blue-600 text-white"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        }`,
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`${styles.container} ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={styles.button(isActive)}
          >
            {Icon && <Icon size={16} />}
            {tab.label}
            {tab.badge && (
              <span className="ml-1.5 text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
