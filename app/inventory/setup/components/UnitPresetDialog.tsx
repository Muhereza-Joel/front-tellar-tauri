"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Scale,
  Library,
  X,
  Check,
  FolderOpen,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Matches your Rust `UnitPresetItem` struct
interface UnitPresetItem {
  name: String;
  singular: String;
  plural: String;
  description: string | null;
}

// Matches your Rust `PresetLibrary` struct
interface PresetLibrary {
  id: string;
  label: string;
  description: string;
  units: UnitPresetItem[];
}

interface UnitPresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPresetsImported: (selectedUnits: UnitPresetItem[]) => Promise<void>;
}

export function UnitPresetDialog({
  isOpen,
  onClose,
  onPresetsImported,
}: UnitPresetDialogProps) {
  const [libraries, setLibraries] = useState<PresetLibrary[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(
    null,
  );
  const [selectedUnits, setSelectedUnits] = useState<Record<string, boolean>>(
    {},
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load libraries from Tauri when open
  useEffect(() => {
    if (!isOpen) return;

    const fetchPresets = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await invoke<PresetLibrary[]>("get_unit_presets");
        setLibraries(data);
        if (data.length > 0) {
          setSelectedLibraryId(data[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to load unit presets from disk.");
      } finally {
        setLoading(false);
      }
    };

    fetchPresets();
  }, [isOpen]);

  const activeLibrary = libraries.find((lib) => lib.id === selectedLibraryId);

  // Initialize/Reset selections when moving libraries
  useEffect(() => {
    if (activeLibrary) {
      const initialSelection: Record<string, boolean> = {};
      activeLibrary.units.forEach((unit) => {
        initialSelection[unit.name.toString()] = true; // Checked by default
      });
      setSelectedUnits(initialSelection);
    }
  }, [selectedLibraryId, activeLibrary]);

  const toggleUnit = (name: string) => {
    setSelectedUnits((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleAll = () => {
    if (!activeLibrary) return;
    const allChecked = activeLibrary.units.every(
      (u) => selectedUnits[u.name.toString()],
    );
    const nextState: Record<string, boolean> = {};
    activeLibrary.units.forEach((u) => {
      nextState[u.name.toString()] = !allChecked;
    });
    setSelectedUnits(nextState);
  };

  const handleImport = async () => {
    if (!activeLibrary) return;

    const unitsToImport = activeLibrary.units.filter(
      (u) => selectedUnits[u.name.toString()],
    );

    if (unitsToImport.length === 0) return;

    setImporting(true);
    try {
      await onPresetsImported(unitsToImport);
      onClose();
    } catch (err) {
      setError("An error occurred while bulk-importing standard categories.");
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-[550px] rounded-xs overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Library className="text-blue-500" size={18} />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Standard Measurement Presets
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Easily setup your store using standard predefined units.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Error State Banner */}
        {error && (
          <div className="px-6 py-2.5 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden divide-x divide-zinc-100 dark:divide-zinc-900">
          {/* Left Panel: Available Libraries */}
          <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 overflow-y-auto space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block px-2 mb-2">
              Preset Groupings
            </span>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400 text-xs">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span>Reading presets...</span>
              </div>
            ) : libraries.length === 0 ? (
              <p className="text-xs text-zinc-400 p-2 italic">
                No preset libraries found inside presets/units/.
              </p>
            ) : (
              libraries.map((lib) => (
                <button
                  key={lib.id}
                  onClick={() => setSelectedLibraryId(lib.id)}
                  className={`w-full text-left p-3 transition-all flex flex-col gap-0.5 group ${
                    selectedLibraryId === lib.id
                      ? "bg-blue-500/10 dark:bg-blue-600/10 border-l-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900 border-l-2 border-transparent text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <span className="text-xs font-bold group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    {lib.label}
                  </span>
                  <span className="text-[10px] opacity-80 line-clamp-1">
                    {lib.description}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Right Panel: Units Selector Checkbox List */}
          <div className="md:col-span-2 flex flex-col overflow-hidden bg-white dark:bg-black">
            {activeLibrary ? (
              <>
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/20">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <FolderOpen size={14} className="text-zinc-400" />
                      {activeLibrary.label} Package Units
                    </h3>
                  </div>
                  <button
                    onClick={toggleAll}
                    className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {activeLibrary.units.every(
                      (u) => selectedUnits[u.name.toString()],
                    )
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 px-4">
                  {activeLibrary.units.map((unit) => {
                    const uName = unit.name.toString();
                    const isChecked = !!selectedUnits[uName];
                    return (
                      <label
                        key={uName}
                        className="flex items-start gap-3 py-3 px-2 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-transparent rounded-xs"
                          checked={isChecked}
                          onChange={() => toggleUnit(uName)}
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {uName}
                            </span>
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 text-zinc-500 font-mono">
                              {unit.singular} / {unit.plural}
                            </span>
                          </div>
                          {unit.description && (
                            <p className="text-zinc-400 dark:text-zinc-500 text-[11px] mt-0.5">
                              {unit.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs p-6">
                <Scale
                  size={28}
                  className="text-zinc-200 dark:text-zinc-800 mb-2"
                />
                <span>
                  Select a library catalog from the left pane to begin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            {activeLibrary
              ? `${Object.values(selectedUnits).filter(Boolean).length} of ${activeLibrary.units.length} units selected`
              : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={
                importing ||
                !activeLibrary ||
                Object.values(selectedUnits).filter(Boolean).length === 0
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white font-bold px-4 py-2 flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.99]"
            >
              {importing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {importing ? "Importing..." : "Save Units"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
