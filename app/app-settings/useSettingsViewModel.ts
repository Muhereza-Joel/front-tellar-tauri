// useSettingsViewModel.ts
import { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { useNotification } from "../hooks/useNotification";

export function useSettingsViewModel() {
  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const { success, error } = useNotification();
  const [isSaving, setIsSaving] = useState(false);

  // RESTORED: All your original settings exactly as provided
  const [localSettings, setLocalSettings] = useState({
    // Interface Settings
    darkMode: false,
    language: "en",

    // POS Business Logic
    terminalId: "TERM-001",
    currency: "UGX",
    taxPercentage: 0,
    enableTaxInclusivePrices: true,

    // Store Branding & Identity
    storeName: "My Awesome Shop",
    storeAddress: "123 Business Road, Tech City",
    storeEmail: "contact@shop.com",
    storePhone: "+1 234 567 890",
    storeWebsite: "www.shop.com",
    storeLogo: "", // Base64 or local path

    // Receipt & Printing
    autoPrintReceipt: true,
    receiptHeader: "Welcome to our Store",
    receiptFooter: "Thank you for shopping!",
    printerAddress: "192.168.1.100",

    // Connectivity & Sync
    autoSync: false,
    syncIntervalMinutes: 5,
    offlineMode: true,
  });

  // Sync from database/cloud on load
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setLocalSettings((prev) => ({
        ...prev,
        ...settings,
      }));
    }
  }, [settings]);

  const updateField = (field: string, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  // ONE-CLICK SAVE: Loops through all local state and updates the database
  const saveAllSettings = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(localSettings).map(([key, value]) =>
        updateSetting(key, value),
      );
      await Promise.all(promises);
      success("Settings saved successfully.");
    } catch (err) {
      console.error("Save failed:", err);
      error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDarkMode = () => updateField("darkMode", !localSettings.darkMode);
  const toggleAutoSync = () => updateField("autoSync", !localSettings.autoSync);

  return {
    localSettings,
    updateField,
    toggleDarkMode,
    toggleAutoSync,
    saveAllSettings,
    isSaving,
    loading: settingsLoading,
  };
}
