"use client";

import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Clock,
  History,
  AlertTriangle,
  KeyRound,
  EyeOff,
  Save,
  Loader2,
} from "lucide-react";
import { useSecurityViewModel } from "./useSecurityViewModel";

/**
 * HELPER COMPONENTS
 * Moved outside to ensure input focus is never lost while typing
 */
const SectionHeader = ({ title }: { title: string }) => (
  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
    <div className="h-1 w-1 bg-red-500 rounded-full" />
    {title}
  </h3>
);

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

export default function SecuritySettingsPage() {
  const {
    securityConfig,
    togglingFields,
    updateSecurityField,
    toggleSecurityField,
    saveSecurityConfig,
    isSaving,
  } = useSecurityViewModel();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex justify-between items-center bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 sticky top-0 z-20 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">Security & Protection</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Control access and sensitive operation authorizations
          </p>
        </div>
        <button
          onClick={saveSecurityConfig}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? "Save Changes" : "Save Changes"}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start px-4 lg:px-0">
        <div className="space-y-6">
          <section>
            <SectionHeader title="Transaction Security" />
            <div className="space-y-3">
              <ToggleItem
                label="PIN for Voids"
                description="Require Manager PIN to void an item"
                icon={Lock}
                field="requirePinForVoid"
                config={securityConfig}
                onToggle={toggleSecurityField}
                toggling={togglingFields}
              />
              <ToggleItem
                label="PIN for Refunds"
                description="Require Manager PIN for processing returns"
                icon={ShieldCheck}
                field="requirePinForRefund"
                config={securityConfig}
                onToggle={toggleSecurityField}
                toggling={togglingFields}
              />
              <ToggleItem
                label="Manual Price Override"
                description="Allow staff to change item prices at checkout"
                icon={EyeOff}
                field="allowManualPriceOverride"
                config={securityConfig}
                onToggle={toggleSecurityField}
                toggling={togglingFields}
              />
            </div>
          </section>

          <section>
            <SectionHeader title="Terminal Access" />
            <div className="space-y-3">
              <ToggleItem
                label="Biometric Login"
                description="Use fingerprint scanner where available"
                icon={Fingerprint}
                field="biometricLoginEnabled"
                config={securityConfig}
                onToggle={toggleSecurityField}
                toggling={togglingFields}
              />

              <div className="p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Auto-Logout</p>
                      <p className="text-[11px] text-zinc-500">
                        Lock terminal when idle
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={securityConfig.autoLogoutIdle}
                    onClick={() => toggleSecurityField("autoLogoutIdle")}
                  />
                </div>
                {securityConfig.autoLogoutIdle && (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Timeout (Minutes)
                    </label>
                    <input
                      type="number"
                      value={securityConfig.idleTimeoutMinutes}
                      onChange={(e) =>
                        updateSecurityField(
                          "idleTimeoutMinutes",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 mt-1 px-3 py-2 rounded-lg text-sm font-bold outline-none border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <SectionHeader title="Auditing & Logs" />
            <div className="space-y-3">
              <ToggleItem
                label="Audit Logging"
                description="Keep history of all sensitive terminal actions"
                icon={History}
                field="logSensitiveActions"
                config={securityConfig}
                onToggle={toggleSecurityField}
                toggling={togglingFields}
              />
              <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Recent Security Events</p>
                    <p className="text-[11px] text-zinc-500">Last 24 hours</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { time: "10:42 AM", msg: "Manager PIN override for Void" },
                    { time: "09:15 AM", msg: "Successful Biometric login" },
                  ].map((log, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-[11px] py-2 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                    >
                      <span className="text-zinc-400 font-mono">
                        {log.time}
                      </span>
                      <span className="font-medium">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-400">
                  Restricted Mode
                </p>
                <p className="text-[11px] text-red-600/80 dark:text-red-400/70 mt-1 leading-relaxed">
                  Disabling Manager PIN requirements for voids and refunds can
                  increase the risk of internal shrinkage.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
