"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export function SyncTauriTheme() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme) {
      invoke("set_window_theme", { theme });
    }
  }, [theme]);

  return null;
}
