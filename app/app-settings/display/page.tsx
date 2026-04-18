"use client";

import {
  Type,
  Maximize,
  Layout,
  Clock,
  Zap,
  Monitor,
  Eye,
  Scaling,
  Save,
  Loader2,
} from "lucide-react";
import { useDisplayViewModel } from "./useDisplayViewModel";

/**
 * HELPER COMPONENTS
 * Defined outside to ensure input focus is never lost while typing
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

// Smooth Toggle using transform instead of flex-alignment
const ToggleSwitch = ({ enabled, onClick, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`h-6 w-11 rounded-full transition-all duration-300 p-1 relative flex items-center ${
      enabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
    } ${disabled ? "opacity-50 cursor-wait" : ""}`}
  >
    <div
      className={`h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
        enabled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

const ToggleItem = ({
  label,
  description,
  icon: Icon,
  field,
  config,
  onToggle,
  toggling,
}: any) => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <Icon size={18} />
      </div>
      <div>
        <p className="font-bold text-sm">{label}</p>
        <p className="text-[11px] text-zinc-500">{description}</p>
      </div>
    </div>
    <ToggleSwitch
      enabled={config[field]}
      onClick={() => onToggle(field)}
      disabled={toggling[field]}
    />
  </div>
);

export default function DisplaySettingsPage() {
  const {
    displayConfig,
    togglingFields,
    updateDisplayField,
    toggleDisplayField,
    saveDisplayConfig,
    isSaving,
  } = useDisplayViewModel();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex justify-between items-center bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 sticky top-0 z-20 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">Display & Interface</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Adjust terminal appearance and behavior
          </p>
        </div>
        <button
          onClick={saveDisplayConfig}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 lg:px-0">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">
              Typography
            </h3>
            <div className="space-y-3">
              <InputWrapper label="Interface Font" icon={Type}>
                <select
                  value={displayConfig.fontFamily}
                  onChange={(e) =>
                    updateDisplayField("fontFamily", e.target.value)
                  }
                  className="w-full bg-transparent font-bold outline-none text-sm cursor-pointer"
                >
                  <option value="Inter">Inter (Default)</option>
                  <option value="Roboto">Roboto</option>
                  <option value="System">System Sans</option>
                  <option value="Mono">Space Mono</option>
                </select>
              </InputWrapper>

              <InputWrapper label="Font Size" icon={Eye}>
                <div className="flex gap-2 pt-1">
                  {["sm", "base", "lg", "xl"].map((size) => (
                    <button
                      key={size}
                      onClick={() => updateDisplayField("fontSize", size)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                        displayConfig.fontSize === size
                          ? "bg-blue-600 border-blue-600 text-white shadow-md"
                          : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100"
                      }`}
                    >
                      {size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </InputWrapper>
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">
              Scaling & Density
            </h3>
            <div className="space-y-3">
              <InputWrapper
                label={`UI Scaling Factor (${displayConfig.uiScaling}%)`}
                icon={Scaling}
              >
                <input
                  type="range"
                  min="80"
                  max="150"
                  step="5"
                  value={displayConfig.uiScaling}
                  onChange={(e) =>
                    updateDisplayField("uiScaling", Number(e.target.value))
                  }
                  className="w-full accent-blue-600 h-2 bg-zinc-200 rounded-lg cursor-pointer"
                />
              </InputWrapper>

              <ToggleItem
                label="Compact Mode"
                description="Reduce padding and margins for more content"
                icon={Layout}
                field="compactMode"
                config={displayConfig}
                onToggle={toggleDisplayField}
                toggling={togglingFields}
              />

              <ToggleItem
                label="Sidebar Labels"
                description="Show text labels next to navigation icons"
                icon={Layout}
                field="showSidebarLabels"
                config={displayConfig}
                onToggle={toggleDisplayField}
                toggling={togglingFields}
              />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">
              Interface Behavior
            </h3>
            <div className="space-y-3">
              <ToggleItem
                label="Show Terminal Clock"
                description="Display current time in the top navigation bar"
                icon={Clock}
                field="showClock"
                config={displayConfig}
                onToggle={toggleDisplayField}
                toggling={togglingFields}
              />
              <ToggleItem
                label="Enable Animations"
                description="Smooth transitions between pages and modals"
                icon={Zap}
                field="enableAnimations"
                config={displayConfig}
                onToggle={toggleDisplayField}
                toggling={togglingFields}
              />
              <ToggleItem
                label="High Contrast"
                description="Improve visibility for sunlight environments"
                icon={Maximize}
                field="highContrast"
                config={displayConfig}
                onToggle={toggleDisplayField}
                toggling={togglingFields}
              />
              <ToggleItem
                label="Customer Display"
                description="Enable support for secondary facing screens"
                icon={Monitor}
                field="customerFacingDisplayEnabled"
                config={displayConfig}
                onToggle={toggleDisplayField}
                toggling={togglingFields}
              />
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">
              Terminal Protection
            </h3>
            <div className="space-y-3">
              <InputWrapper
                label="Idle Screen Timeout (Minutes)"
                icon={Monitor}
              >
                <input
                  type="number"
                  value={displayConfig.screenTimeout}
                  onChange={(e) =>
                    updateDisplayField("screenTimeout", Number(e.target.value))
                  }
                  className="w-full bg-transparent font-bold outline-none text-sm"
                />
              </InputWrapper>

              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                  <strong>Accessibility Note:</strong> Scaling changes will
                  affect thermal receipt previews and modal density.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
