// useHardwareViewModel.ts
import { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useNotification } from "../../hooks/useNotification"; // Import your notification hook

export interface Device {
  id: string;
  name: string;
  type: "printer" | "scanner" | "display" | "drawer";
  status: "online" | "offline" | "busy";
  connection: "usb" | "network" | "serial";
  address?: string;
}

export function useHardwareViewModel() {
  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const { success, error } = useNotification(); // Initialize notifications
  const [devices, setDevices] = useState<Device[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [hwConfig, setHwConfig] = useState({
    defaultPrinterId: "",
    printerDPI: 203,
    scannerSuffix: "Enter",
    openDrawerOnCard: false,
    poleDisplayWelcome: "Welcome to our store!",
  });

  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setHwConfig((prev) => ({ ...prev, ...settings }));
    }
    refreshDevices();
  }, [settings]);

  // One-Click Save logic
  const saveHardwareConfig = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(hwConfig).map(([key, value]) =>
        updateSetting(key, value),
      );
      await Promise.all(promises);
      success("Hardware configuration saved successfully.");
    } catch (err) {
      console.error("Save failed:", err);
      error("Failed to save hardware settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const refreshDevices = async () => {
    const discovered: Device[] = [
      {
        id: "p1",
        name: "Epson TM-T88VI",
        type: "printer",
        status: "online",
        connection: "network",
        address: "192.168.1.100",
      },
      {
        id: "s1",
        name: "Honeywell Genesis",
        type: "scanner",
        status: "online",
        connection: "usb",
      },
      {
        id: "d1",
        name: "Standard Cash Drawer",
        type: "drawer",
        status: "online",
        connection: "usb",
      },
    ];
    setDevices(discovered);
  };

  const testDevice = async (device: Device) => {
    alert(`Test command sent to ${device.name}`);
  };

  const updateHwField = (field: string, value: any) => {
    setHwConfig((prev) => ({ ...prev, [field]: value }));
  };

  return {
    devices,
    hwConfig,
    loading: settingsLoading,
    isSaving,
    refreshDevices,
    testDevice,
    updateHwField,
    saveHardwareConfig,
  };
}
