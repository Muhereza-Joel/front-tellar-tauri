// useDisplayViewModel.ts
import { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useNotification } from "../../hooks/useNotification"; //

export function useDisplayViewModel() {
  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const { success, error } = useNotification(); //
  const [isSaving, setIsSaving] = useState(false);
  const [togglingFields, setTogglingFields] = useState<Record<string, boolean>>(
    {},
  );

  // ALL ORIGINAL SETTINGS PRESERVED
  const [displayConfig, setDisplayConfig] = useState({
    fontSize: "base",
    fontFamily: "Inter",
    highContrast: false,
    compactMode: false,
    showSidebarLabels: true,
    uiScaling: 100,
    showClock: true,
    enableAnimations: true,
    customerFacingDisplayEnabled: false,
    screenTimeout: 10,
  });

  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setDisplayConfig((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const updateDisplayField = (field: string, value: any) => {
    setDisplayConfig((prev) => ({ ...prev, [field]: value }));
  };

  // One-click save logic
  const saveDisplayConfig = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(displayConfig).map(([key, value]) =>
        updateSetting(key, value),
      );
      await Promise.all(promises);
      success("Display preferences updated successfully."); //
    } catch (err) {
      console.error("Save failed:", err);
      error("Failed to save display settings."); //
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDisplayField = async (field: string) => {
    if (togglingFields[field]) return;
    setTogglingFields((prev) => ({ ...prev, [field]: true }));

    const newValue = !displayConfig[field as keyof typeof displayConfig];
    updateDisplayField(field, newValue);

    setTimeout(() => {
      setTogglingFields((prev) => ({ ...prev, [field]: false }));
    }, 400);
  };

  return {
    displayConfig,
    togglingFields,
    loading: settingsLoading,
    isSaving,
    updateDisplayField,
    toggleDisplayField,
    saveDisplayConfig,
  };
}
