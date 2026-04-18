"use client";

import {
  Printer,
  Monitor as MonitorIcon,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play,
  Save,
  Loader2,
} from "lucide-react";
import { useHardwareViewModel } from "./useHardwareViewModel";

/**
 * HELPER COMPONENTS
 * Moved outside to prevent focus loss during typing
 */
const InputWrapper = ({ label, icon: Icon, children }: any) => (
  <div className="p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 focus-within:border-blue-500 transition-colors">
    <div className="flex items-center gap-2 text-zinc-500">
      <Icon size={14} />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
    {children}
  </div>
);

const ToggleSwitch = ({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`h-6 w-11 rounded-full transition-colors duration-300 p-1 relative flex items-center ${
      enabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
    }`}
  >
    <div
      className={`h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
        enabled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

export default function HardwareSettingsPage() {
  const {
    devices,
    hwConfig,
    refreshDevices,
    testDevice,
    updateHwField,
    saveHardwareConfig,
    isSaving,
  } = useHardwareViewModel();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex justify-between items-center bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 sticky top-0 z-20 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">Hardware Management</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Configure and manage connected peripherals
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshDevices}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all font-bold text-sm"
          >
            <RefreshCw size={16} />
            Scan
          </button>
          <button
            onClick={saveHardwareConfig}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white px-6 py-2 rounded-xl font-bold transition-all active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 lg:px-0">
        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Printer & Display
            </h3>
            <div className="space-y-3">
              <InputWrapper label="Default Receipt Printer" icon={Printer}>
                <select
                  value={hwConfig.defaultPrinterId}
                  onChange={(e) =>
                    updateHwField("defaultPrinterId", e.target.value)
                  }
                  className="w-full bg-transparent font-bold outline-none text-sm cursor-pointer"
                >
                  <option value="">Select a printer...</option>
                  {devices
                    .filter((d) => d.type === "printer")
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </InputWrapper>

              <InputWrapper label="Printer DPI" icon={Printer}>
                <input
                  type="number"
                  value={hwConfig.printerDPI}
                  onChange={(e) =>
                    updateHwField("printerDPI", Number(e.target.value))
                  }
                  className="w-full bg-transparent font-bold outline-none text-sm"
                />
              </InputWrapper>

              <InputWrapper label="Pole Display Message" icon={MonitorIcon}>
                <input
                  type="text"
                  value={hwConfig.poleDisplayWelcome}
                  onChange={(e) =>
                    updateHwField("poleDisplayWelcome", e.target.value)
                  }
                  className="w-full bg-transparent font-medium outline-none text-sm"
                />
              </InputWrapper>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Scanner & Drawer
            </h3>
            <div className="space-y-3">
              <InputWrapper label="Scanner Suffix" icon={CreditCard}>
                <input
                  type="text"
                  value={hwConfig.scannerSuffix}
                  onChange={(e) =>
                    updateHwField("scannerSuffix", e.target.value)
                  }
                  className="w-full bg-transparent font-bold outline-none text-sm"
                />
              </InputWrapper>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      Kick Drawer on Card Sale
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Open drawer automatically for card payments
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={hwConfig.openDrawerOnCard}
                  onClick={() =>
                    updateHwField(
                      "openDrawerOnCard",
                      !hwConfig.openDrawerOnCard,
                    )
                  }
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
            Connected Devices
          </h3>
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="p-4 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={
                        device.status === "online"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    >
                      {device.status === "online" ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <AlertCircle size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{device.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase">
                        {device.type} • {device.connection}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => testDevice(device)}
                    className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center gap-2 text-xs font-bold transition-transform active:scale-90"
                  >
                    <Play size={14} fill="currentColor" />
                    Test
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
