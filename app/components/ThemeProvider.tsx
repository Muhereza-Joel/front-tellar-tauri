"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// Sync Tauri bar on mount
export function SyncTauriTheme() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme) {
      invoke("set_window_theme", { theme });
    }
  }, [theme]);

  return null;
}
