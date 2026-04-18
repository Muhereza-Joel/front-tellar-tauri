"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    // Tell Tauri to update window bar theme
    await invoke("set_window_theme", { theme: newTheme });
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors 
                 bg-gray-200 dark:bg-gray-800 
                 text-gray-800 dark:text-gray-200 
                 hover:bg-gray-300 dark:hover:bg-gray-700"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
