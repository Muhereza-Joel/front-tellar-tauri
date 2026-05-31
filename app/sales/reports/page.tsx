"use client";

import {
  TrendingDown,
  DollarSign,
  PieChart,
  RefreshCw,
  Target,
} from "lucide-react";
import {
  useBusinessPerformanceViewModel,
  PresetKey,
  FilterMode,
} from "./useBusinessPerformanceViewModel";

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(amount);

export default function BusinessProfilePerformancePage() {
  const vm = useBusinessPerformanceViewModel();

  if (vm.loading)
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col items-center justify-center gap-3">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
        <p className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
          Reconciling Ledger...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* TOP BAR / NAVIGATION */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic decoration-blue-500 decoration-4 underline-offset-4">
              Financial <span className="text-blue-600">Intelligence</span>
            </h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
              Real-time Fiscal Performance Audit
            </p>
          </div>

          {/* INDUSTRIAL FILTER CONTROL CENTER */}
          <div className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {/* Mode Switcher */}
            <select
              value={vm.filterMode}
              onChange={(e) => vm.setFilterMode(e.target.value as FilterMode)}
              className="bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg border-none focus:ring-2 ring-blue-500"
            >
              <option value="PRESET">Quick Presets</option>
              <option value="CUSTOM_DAY">Specific Day</option>
              <option value="CUSTOM_WEEK">Specific Week</option>
              <option value="CUSTOM_MONTH">Specific Month</option>
              <option value="CUSTOM_YEAR">Specific Year</option>
            </select>

            <div className="h-full w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />

            {/* Sub-Controls */}
            {vm.filterMode === "PRESET" ? (
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {(
                  [
                    "TODAY",
                    "THIS_WEEK",
                    "THIS_MONTH",
                    "THIS_QUARTER",
                    "THIS_YEAR",
                    "ALL",
                  ] as PresetKey[]
                ).map((p) => (
                  <button
                    key={p}
                    onClick={() => vm.setPreset(p)}
                    className={`px-3 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${vm.preset === p ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                  >
                    {p.replace("_", " ")}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type={
                    vm.filterMode === "CUSTOM_DAY" ||
                    vm.filterMode === "CUSTOM_WEEK"
                      ? "date"
                      : vm.filterMode === "CUSTOM_MONTH"
                        ? "month"
                        : "number"
                  }
                  min={vm.filterMode === "CUSTOM_YEAR" ? "2020" : undefined}
                  max={vm.filterMode === "CUSTOM_YEAR" ? "2030" : undefined}
                  value={
                    vm.filterMode === "CUSTOM_YEAR"
                      ? vm.customDate.split("-")[0]
                      : vm.customDate
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    vm.setCustomDate(
                      vm.filterMode === "CUSTOM_YEAR" ? `${val}-01-01` : val,
                    );
                  }}
                  className="bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold px-4 py-2 rounded-lg border-none"
                />
                <span className="text-[10px] font-black text-blue-500 uppercase">
                  Precision Active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* METRIC GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Gross Inflow"
            value={vm.metrics.totalRevenue}
            sub={
              <div className="flex flex-col gap-0.5 mt-1 text-[9px] font-mono font-bold tracking-tight text-zinc-500">
                <span className="flex justify-between gap-4">
                  <span>PRODUCTS:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {formatUGX(vm.metrics.directSalesRevenue)}
                  </span>
                </span>
                <span className="flex justify-between gap-4">
                  <span>SERVICES:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {formatUGX(vm.metrics.serviceSalesRevenue)}
                  </span>
                </span>
              </div>
            }
            icon={<DollarSign size={18} />}
          />
          <MetricCard
            title="Total Outflow"
            value={vm.metrics.totalExpenses}
            sub={`${vm.metrics.expenseToRevenueRatio}% Burn Rate`}
            icon={<TrendingDown size={18} />}
            isNegative
          />
          <MetricCard
            title="Net Position"
            value={vm.metrics.netProfit}
            sub={`${vm.metrics.profitMargin}% Profit Margin`}
            icon={<Target size={18} />}
            isProfit
            trend={vm.metrics.netProfit >= 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* EXPENSE ANALYSIS */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <PieChart size={14} className="text-blue-500" /> Expense
                Taxonomy Breakdown
              </h3>
            </div>
            <div className="space-y-6">
              {vm.metrics.expenseBreakdown.map((item) => (
                <div key={item.category} className="group">
                  <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                    <span className="text-zinc-500">{item.category}</span>
                    <span className="font-mono">
                      {formatUGX(item.total)}{" "}
                      <span className="ml-2 text-zinc-400">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LEDGER DETAILS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-80">
                Quick Audit Summary
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium opacity-80">
                    Product Streams
                  </span>
                  <span className="font-mono font-black">
                    {formatUGX(vm.metrics.directSalesRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium opacity-80">
                    Service Streams
                  </span>
                  <span className="font-mono font-black">
                    {formatUGX(vm.metrics.serviceSalesRevenue)}
                  </span>
                </div>
                <div className="h-[1px] bg-white/20" />
                <div className="flex justify-between text-sm">
                  <span className="font-medium opacity-80">Retained Yield</span>
                  <span className="font-mono font-black">
                    {formatUGX(vm.metrics.netProfit)}
                  </span>
                </div>
                <div className="h-[1px] bg-white/20" />
                <div className="text-[10px] leading-relaxed opacity-80 italic">
                  Data reflects activity from{" "}
                  {vm.filterMode === "PRESET"
                    ? vm.preset.replace("_", " ")
                    : "Custom Range Selection"}
                  .
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon,
  isNegative,
  isProfit,
  trend,
}: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {title}
          </span>
          <div
            className={`p-2 rounded-lg ${isProfit ? (trend ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500") : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}
          >
            {icon}
          </div>
        </div>
        <div
          className={`text-2xl font-mono font-black tracking-tighter ${isNegative ? "text-rose-600" : isProfit ? (trend ? "text-emerald-600" : "text-rose-600") : ""}`}
        >
          {formatUGX(value)}
        </div>
      </div>
      <div className="text-[10px] font-bold text-zinc-500 mt-2 uppercase tracking-tight">
        {sub}
      </div>
    </div>
  );
}
