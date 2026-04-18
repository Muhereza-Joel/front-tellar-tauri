"use client";

import {
  CloudSync,
  Moon,
  Printer,
  Receipt,
  Coins,
  Percent,
  Languages,
  Store,
  MapPin,
  Mail,
  Phone,
  Globe,
  Image as ImageIcon,
  Save,
  Loader2,
} from "lucide-react";
import { useSettingsViewModel } from "./useSettingsViewModel";

/**
 * HELPER COMPONENTS
 * Moved outside SettingsPage so they don't re-mount and lose input focus
 */
const SectionHeader = ({ title }: { title: string }) => (
  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
    <div className="h-1 w-1 bg-blue-500 rounded-full" />
    {title}
  </h3>
);

const InputWrapper = ({ label, icon: Icon, children }: any) => (
  <div className="p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 focus-within:border-blue-500 transition-colors">
    <div className="flex items-center gap-2 text-zinc-500">
      <Icon size={14} />
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </div>
    {children}
  </div>
);

// Toggle with smooth slide delay using CSS transform
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

export default function SettingsPage() {
  const {
    localSettings,
    updateField,
    toggleDarkMode,
    toggleAutoSync,
    saveAllSettings,
    isSaving,
  } = useSettingsViewModel();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex justify-between items-center bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 sticky top-0 z-20 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">General Settings</h2>
          <p className="text-sm text-zinc-500">
            Terminal: {localSettings.terminalId}
          </p>
        </div>
        <button
          onClick={saveAllSettings}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start px-4 lg:px-0">
        {/* LEFT COLUMN: STORE IDENTITY */}
        <div className="space-y-6">
          <section>
            <SectionHeader title="Store Branding & Contact" />
            <div className="space-y-3">
              <InputWrapper label="Store Name" icon={Store}>
                <input
                  type="text"
                  value={localSettings.storeName}
                  onChange={(e) => updateField("storeName", e.target.value)}
                  className="w-full bg-transparent font-bold outline-none text-sm"
                />
              </InputWrapper>

              <InputWrapper label="Physical Address" icon={MapPin}>
                <textarea
                  rows={2}
                  value={localSettings.storeAddress}
                  onChange={(e) => updateField("storeAddress", e.target.value)}
                  className="w-full bg-transparent font-medium outline-none text-sm resize-none"
                />
              </InputWrapper>

              <div className="grid grid-cols-2 gap-3">
                <InputWrapper label="Contact Email" icon={Mail}>
                  <input
                    type="email"
                    value={localSettings.storeEmail}
                    onChange={(e) => updateField("storeEmail", e.target.value)}
                    className="w-full bg-transparent font-medium outline-none text-sm"
                  />
                </InputWrapper>
                <InputWrapper label="Phone Number" icon={Phone}>
                  <input
                    type="text"
                    value={localSettings.storePhone}
                    onChange={(e) => updateField("storePhone", e.target.value)}
                    className="w-full bg-transparent font-medium outline-none text-sm"
                  />
                </InputWrapper>
              </div>

              <InputWrapper label="Website URL" icon={Globe}>
                <input
                  type="text"
                  value={localSettings.storeWebsite}
                  onChange={(e) => updateField("storeWebsite", e.target.value)}
                  className="w-full bg-transparent font-medium outline-none text-sm"
                />
              </InputWrapper>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center py-8 gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <ImageIcon size={24} className="text-zinc-400" />
                <span className="text-xs font-bold text-zinc-500">
                  Upload Store Logo
                </span>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader title="Localization & Language" />
            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <Languages size={18} />
                </div>
                <p className="font-bold text-sm">System Language</p>
              </div>
              <select
                value={localSettings.language}
                onChange={(e) => updateField("language", e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border-none text-sm rounded-lg px-3 py-1 outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: TECHNICAL & POS LOGIC */}
        <div className="space-y-6">
          <section>
            <SectionHeader title="Financial & POS Logic" />
            <div className="grid grid-cols-2 gap-3">
              <InputWrapper label="Currency Code" icon={Coins}>
                <input
                  type="text"
                  value={localSettings.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className="w-full bg-transparent font-bold outline-none text-sm"
                />
              </InputWrapper>
              <InputWrapper label="Tax Rate (%)" icon={Percent}>
                <input
                  type="number"
                  value={localSettings.taxPercentage}
                  onChange={(e) =>
                    updateField("taxPercentage", Number(e.target.value))
                  }
                  className="w-full bg-transparent font-bold outline-none text-sm"
                />
              </InputWrapper>
            </div>
            {/* Tax Inclusive Toggle */}
            <div className="mt-3 flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-sm">Tax Inclusive Prices</p>
              <ToggleSwitch
                enabled={localSettings.enableTaxInclusivePrices}
                onClick={() =>
                  updateField(
                    "enableTaxInclusivePrices",
                    !localSettings.enableTaxInclusivePrices,
                  )
                }
              />
            </div>
          </section>

          <section>
            <SectionHeader title="Hardware & Printing" />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <Printer size={18} />
                  </div>
                  <p className="font-bold text-sm">Auto-Print Receipt</p>
                </div>
                <ToggleSwitch
                  enabled={localSettings.autoPrintReceipt}
                  onClick={() =>
                    updateField(
                      "autoPrintReceipt",
                      !localSettings.autoPrintReceipt,
                    )
                  }
                />
              </div>

              <InputWrapper label="Receipt Header" icon={Receipt}>
                <input
                  value={localSettings.receiptHeader}
                  onChange={(e) => updateField("receiptHeader", e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </InputWrapper>

              <InputWrapper label="Receipt Footer" icon={Receipt}>
                <input
                  value={localSettings.receiptFooter}
                  onChange={(e) => updateField("receiptFooter", e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </InputWrapper>

              <InputWrapper label="Printer Address" icon={Printer}>
                <input
                  value={localSettings.printerAddress}
                  onChange={(e) =>
                    updateField("printerAddress", e.target.value)
                  }
                  className="w-full bg-transparent text-sm outline-none"
                />
              </InputWrapper>
            </div>
          </section>

          <section>
            <SectionHeader title="Connectivity & Sync" />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <CloudSync size={18} />
                  </div>
                  <p className="font-bold text-sm">Cloud Sync</p>
                </div>
                <ToggleSwitch
                  enabled={localSettings.autoSync}
                  onClick={toggleAutoSync}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <Moon size={18} />
                  </div>
                  <p className="font-bold text-sm">Interface Theme</p>
                </div>
                <ToggleSwitch
                  enabled={localSettings.darkMode}
                  onClick={toggleDarkMode}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
