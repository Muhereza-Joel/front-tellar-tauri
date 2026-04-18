// useSecurityViewModel.ts
import { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useNotification } from "../../hooks/useNotification"; //

export function useSecurityViewModel() {
  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const { success, error } = useNotification(); //
  const [isSaving, setIsSaving] = useState(false);
  const [togglingFields, setTogglingFields] = useState<Record<string, boolean>>(
    {},
  );

  // ALL ORIGINAL SETTINGS PRESERVED
  const [securityConfig, setSecurityConfig] = useState({
    requirePinForVoid: true,
    requirePinForRefund: true,
    autoLogoutIdle: false,
    idleTimeoutMinutes: 5,
    restrictSalesToAssignedBranch: true,
    allowManualPriceOverride: false,
    biometricLoginEnabled: false,
    allowRemoteSupportAccess: false,
    logSensitiveActions: true,
  });

  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setSecurityConfig((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const updateSecurityField = (field: string, value: any) => {
    setSecurityConfig((prev) => ({ ...prev, [field]: value }));
  };

  // One-click manual save logic
  const saveSecurityConfig = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(securityConfig).map(([key, value]) =>
        updateSetting(key, value),
      );
      await Promise.all(promises);
      success("Security policies updated successfully."); //
    } catch (err) {
      console.error("Save failed:", err);
      error("Failed to update security settings."); //
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSecurityField = async (field: string) => {
    if (togglingFields[field]) return;
    setTogglingFields((prev) => ({ ...prev, [field]: true }));

    const newValue = !securityConfig[field as keyof typeof securityConfig];
    updateSecurityField(field, newValue);

    setTimeout(() => {
      setTogglingFields((prev) => ({ ...prev, [field]: false }));
    }, 400); //
  };

  return {
    securityConfig,
    togglingFields,
    loading: settingsLoading,
    isSaving,
    updateSecurityField,
    toggleSecurityField,
    saveSecurityConfig,
  };
}
