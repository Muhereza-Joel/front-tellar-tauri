// hooks/useSettings.ts
import { useState, useEffect } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("settings.json");

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      // Load all settings from the file
      const all = await store.entries();
      const settingsMap = Object.fromEntries(all);
      setSettings(settingsMap);
      setLoading(false);
    };

    loadSettings();
  }, []);

  const getSetting = (key: string, defaultValue: any = null) => {
    return settings[key] ?? defaultValue;
  };

  const updateSetting = async (key: string, value: any) => {
    await store.set(key, value);
    await store.save(); // Persist to settings.json
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, getSetting, updateSetting, loading };
}
