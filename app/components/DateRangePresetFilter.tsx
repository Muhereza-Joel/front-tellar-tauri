"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";

export type DateFilterPayload = {
  preset: string;
  month_number: string;
  month_year: string;
  week_number: string;
  week_year: string;
  from: string;
  until: string;
};

interface DateRangePresetFilterProps {
  onFilterChange: (dates: { from: string; until: string }) => void;
  onIndicatorChange?: (label: string | null) => void;
}

const PRESETS = [
  { id: "", label: "None (Clear Filter)" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7_days", label: "Last 7 Days" },
  { id: "14_days", label: "Last 14 Days" },
  { id: "30_days", label: "Last 30 Days" },
  { id: "90_days", label: "Last 90 Days" },
  { id: "this_week", label: "This Week (Mon–Today)" },
  { id: "last_week", label: "Last Week (Mon–Sun)" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "custom_month", label: "Custom Month" },
  { id: "this_quarter", label: "This Quarter" },
  { id: "last_quarter", label: "Last Quarter" },
  { id: "this_year", label: "This Year" },
  { id: "last_year", label: "Last Year" },
  { id: "custom_week", label: "Custom Week" },
];

export function DateRangePresetFilter({
  onFilterChange,
  onIndicatorChange,
}: DateRangePresetFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<DateFilterPayload>({
    preset: "",
    month_number: String(new Date().getMonth() + 1),
    month_year: String(currentYear),
    week_number: "1",
    week_year: String(currentYear),
    from: "",
    until: "",
  });

  const updateField = (key: keyof DateFilterPayload, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      // Clear manual fields if a native quick preset is selected (except custom configurations)
      if (
        key === "preset" &&
        value !== "custom_month" &&
        value !== "custom_week" &&
        value !== ""
      ) {
        updated.from = "";
        updated.until = "";
      }
      return updated;
    });
  };

  const getWeekRange = (year: number, week: number) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    const ISOweekEnd = new Date(ISOweekStart);
    ISOweekEnd.setDate(ISOweekEnd.getDate() + 6);
    return { start: ISOweekStart, end: ISOweekEnd };
  };

  useEffect(() => {
    const now = new Date();
    let computedFrom = formData.from;
    let computedUntil = formData.until;
    let indicator: string | null = null;

    if (formData.preset) {
      const todayStr = now.toISOString().split("T")[0];

      switch (formData.preset) {
        case "today":
          computedFrom = todayStr;
          computedUntil = todayStr;
          indicator = "Created Today";
          break;
        case "yesterday": {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          const yestStr = yesterday.toISOString().split("T")[0];
          computedFrom = yestStr;
          computedUntil = yestStr;
          indicator = "Created Yesterday";
          break;
        }
        case "7_days": {
          const d7 = new Date();
          d7.setDate(now.getDate() - 7);
          computedFrom = d7.toISOString().split("T")[0];
          computedUntil = todayStr;
          indicator = "Created in Last 7 Days";
          break;
        }
        case "14_days": {
          const d14 = new Date();
          d14.setDate(now.getDate() - 14);
          computedFrom = d14.toISOString().split("T")[0];
          computedUntil = todayStr;
          indicator = "Created in Last 14 Days";
          break;
        }
        case "30_days": {
          const d30 = new Date();
          d30.setDate(now.getDate() - 30);
          computedFrom = d30.toISOString().split("T")[0];
          computedUntil = todayStr;
          indicator = "Created in Last 30 Days";
          break;
        }
        case "90_days": {
          const d90 = new Date();
          d90.setDate(now.getDate() - 90);
          computedFrom = d90.toISOString().split("T")[0];
          computedUntil = todayStr;
          indicator = "Created in Last 90 Days";
          break;
        }
        case "this_week": {
          const currentDay = now.getDay();
          const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
          const monday = new Date(now);
          monday.setDate(now.getDate() + distanceToMonday);
          computedFrom = monday.toISOString().split("T")[0];
          computedUntil = todayStr;
          indicator = "Created This Week (Mon–Today)";
          break;
        }
        case "last_week": {
          const currentDay = now.getDay();
          const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
          const lastMonday = new Date(now);
          lastMonday.setDate(now.getDate() + distanceToMonday - 7);
          const lastSunday = new Date(lastMonday);
          lastSunday.setDate(lastMonday.getDate() + 6);
          computedFrom = lastMonday.toISOString().split("T")[0];
          computedUntil = lastSunday.toISOString().split("T")[0];
          indicator = "Created Last Week (Mon–Sun)";
          break;
        }
        case "this_month": {
          const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          computedFrom = startMonth.toISOString().split("T")[0];
          computedUntil = todayStr;
          indicator = "Created This Month";
          break;
        }
        case "last_month": {
          const startLastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1,
          );
          const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          computedFrom = startLastMonth.toISOString().split("T")[0];
          computedUntil = endLastMonth.toISOString().split("T")[0];
          indicator = "Created Last Month";
          break;
        }
        case "this_quarter": {
          const quarter = Math.floor(now.getMonth() / 3);
          const startQ = new Date(now.getFullYear(), quarter * 3, 1);
          computedFrom = startQ.toISOString().split("T")[0];
          computedUntil = todayStr;
          indicator = "Created This Quarter";
          break;
        }
        case "last_quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startLastQ = new Date(
            now.getFullYear(),
            (currentQuarter - 1) * 3,
            1,
          );
          const endLastQ = new Date(now.getFullYear(), currentQuarter * 3, 0);
          computedFrom = startLastQ.toISOString().split("T")[0];
          computedUntil = endLastQ.toISOString().split("T")[0];
          indicator = "Created Last Quarter";
          break;
        }
        case "this_year":
          computedFrom = `${now.getFullYear()}-01-01`;
          computedUntil = todayStr;
          indicator = "Created This Year";
          break;
        case "last_year":
          computedFrom = `${now.getFullYear() - 1}-01-01`;
          computedUntil = `${now.getFullYear() - 1}-12-31`;
          indicator = "Created Last Year";
          break;
        case "custom_month": {
          const m = parseInt(formData.month_number);
          const y = parseInt(formData.month_year);
          if (!isNaN(m) && !isNaN(y) && m >= 1 && m <= 12) {
            const startStr = new Date(y, m - 1, 1);
            const endStr = new Date(y, m, 0);
            computedFrom = startStr.toISOString().split("T")[0];
            computedUntil = endStr.toISOString().split("T")[0];
            indicator = `Created in ${y}-${String(m).padStart(2, "0")}`;
          }
          break;
        }
        case "custom_week": {
          const w = parseInt(formData.week_number);
          const y = parseInt(formData.week_year);
          if (!isNaN(w) && !isNaN(y) && w >= 1 && w <= 53) {
            const range = getWeekRange(y, w);
            computedFrom = range.start.toISOString().split("T")[0];
            computedUntil = range.end.toISOString().split("T")[0];
            indicator = `Created in Week ${w} of ${y}`;
          }
          break;
        }
      }
    } else {
      // No preset, evaluate explicit values
      if (formData.from && formData.until) {
        indicator = `Created between ${formData.from} and ${formData.until}`;
      } else if (formData.from) {
        indicator = `Created after ${formData.from}`;
      } else if (formData.until) {
        indicator = `Created before ${formData.until}`;
      }
    }

    onFilterChange({ from: computedFrom, until: computedUntil });
    if (onIndicatorChange) onIndicatorChange(indicator);
  }, [formData]);

  const clearFilters = () => {
    setFormData({
      preset: "",
      month_number: String(new Date().getMonth() + 1),
      month_year: String(currentYear),
      week_number: "1",
      week_year: String(currentYear),
      from: "",
      until: "",
    });
  };

  const hasActiveFilters = formData.preset || formData.from || formData.until;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border rounded-lg transition-all outline-none bg-white dark:bg-zinc-900 
          ${hasActiveFilters ? "border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/10" : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
      >
        <Calendar size={14} />
        <span>Date Filter Engine</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 z-40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                Filter Settings
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:underline"
                >
                  <X size={10} /> Reset
                </button>
              )}
            </div>

            {/* Quick Range Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                Quick Range
              </label>
              <select
                value={formData.preset}
                onChange={(e) => updateField("preset", e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 dark:text-white"
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Form for Custom Month */}
            {formData.preset === "custom_month" && (
              <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg animate-in zoom-in-95 duration-100">
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                    Month (1-12)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.month_number}
                    onChange={(e) =>
                      updateField("month_number", e.target.value)
                    }
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.month_year}
                    onChange={(e) => updateField("month_year", e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Sub-Form for Custom Week */}
            {formData.preset === "custom_week" && (
              <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg animate-in zoom-in-95 duration-100">
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                    Week (1-53)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={53}
                    value={formData.week_number}
                    onChange={(e) => updateField("week_number", e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.week_year}
                    onChange={(e) => updateField("week_year", e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Manual Boundaries Partition */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Added From
                </label>
                <input
                  type="date"
                  disabled={
                    !!formData.preset &&
                    formData.preset !== "custom_month" &&
                    formData.preset !== "custom_week"
                  }
                  value={formData.from}
                  onChange={(e) => updateField("from", e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-40 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Added Until
                </label>
                <input
                  type="date"
                  disabled={
                    !!formData.preset &&
                    formData.preset !== "custom_month" &&
                    formData.preset !== "custom_week"
                  }
                  value={formData.until}
                  onChange={(e) => updateField("until", e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-40 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs outline-none dark:text-white"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
