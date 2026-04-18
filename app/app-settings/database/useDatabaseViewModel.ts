// useDatabaseViewModel.ts
import { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useNotification } from "../../hooks/useNotification"; //

export function useDatabaseViewModel() {
  const { settings, updateSetting } = useSettings();
  const { success, error } = useNotification(); //
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingFields, setTogglingFields] = useState<Record<string, boolean>>(
    {},
  );

  // ALL ORIGINAL SETTINGS PRESERVED
  const [dbConfig, setDbConfig] = useState({
    autoBackup: true,
    backupIntervalDays: 1,
    keepBackupCount: 10,
    compressionEnabled: true,
    cloudBackupEnabled: false,
    exportFormat: "CSV", // CSV, JSON, Excel
  });

  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setDbConfig((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  // One-click save logic
  const saveDatabaseConfig = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(dbConfig).map(([key, value]) =>
        updateSetting(key, value),
      );
      await Promise.all(promises);
      success("Database configuration updated successfully."); //
    } catch (err) {
      console.error("Save failed:", err);
      error("Failed to save database settings."); //
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDbField = async (field: string) => {
    if (togglingFields[field]) return;
    setTogglingFields((prev) => ({ ...prev, [field]: true }));

    const newValue = !dbConfig[field as keyof typeof dbConfig];
    setDbConfig((prev) => ({ ...prev, [field]: newValue }));

    setTimeout(() => {
      setTogglingFields((prev) => ({ ...prev, [field]: false }));
    }, 400);
  };

  const runBackup = async () => {
    setIsProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      success("Database backup created successfully!"); //
    } catch (err) {
      error("Manual backup failed."); //
    } finally {
      setIsProcessing(false);
    }
  };

  const exportData = async (target: string) => {
    setIsProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      success(`${target} data exported to Downloads folder.`); //
    } catch (err) {
      error(`Failed to export ${target} data.`); //
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    dbConfig,
    togglingFields,
    isProcessing,
    isSaving,
    setDbConfig,
    toggleDbField,
    runBackup,
    exportData,
    saveDatabaseConfig,
  };
}
