"use client";

import {
  Search,
  Plus,
  TrendingDown,
  Wallet,
  Trash2,
  Edit2,
  RotateCcw,
  Calendar,
  UserPlus,
  FileText,
} from "lucide-react";
import { TableRowSkeleton } from "../../components/Skeletons";
import { Pagination } from "../../components/Pagination";
import { useExpensesViewModel } from "./useExpensesViewModel";

const formatUGX = (amount: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CategoryBadge = ({ category }: { category: string }) => {
  const styles =
    {
      OPEX: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400",
      COGS: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400",
      MARKETING:
        "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400",
      PAYROLL:
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400",
      CAPEX: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400",
      TAX: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400",
      UTILITIES:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400",
      GENERAL: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
    }[category] || "bg-zinc-100 text-zinc-800";

  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-black tracking-wide uppercase ${styles}`}
    >
      {category}
    </span>
  );
};

export default function ExpensesManagementPage() {
  const vm = useExpensesViewModel();

  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-zinc-950 border px-3 py-2 text-sm outline-none transition-all 
    ${vm.errors[fieldName] ? "border-rose-500 ring-1 ring-rose-500/20" : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"}
  `;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-2">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Deck Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <TrendingDown size={22} className="text-rose-500" /> Capital
              Expenditures & Outflows Ledger
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Document organizational operation overhead variables and inventory
              procurement costs mapped directly into gross margin equations.
            </p>
          </div>

          {/* Aggregated KPI Metrics Ticker Box */}
          <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-5 py-3 flex items-center gap-4">
            <TrendingDown className="text-rose-500" size={24} />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-500/70 block">
                Total Ledger Volatility Outflow
              </span>
              <span className="text-lg font-mono font-black text-rose-600 dark:text-rose-400">
                {formatUGX(vm.totalOutflowSum)}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Layout Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT INTERFACE COLUMN: FINANCIAL DISBURSEMENT CONFIGURATOR CONTROL PANEL */}
          <form
            onSubmit={vm.handleSave}
            className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5"
          >
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-xs font-black uppercase text-zinc-400 flex items-center gap-2 tracking-widest">
                <Plus size={16} />{" "}
                {vm.editingUuid
                  ? "Update Transaction Parameter"
                  : "Log Capital Outflow"}
              </h2>
              {vm.editingUuid && (
                <button
                  type="button"
                  onClick={vm.resetForm}
                  className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                  title="Abrogate execution frame"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Transaction Reference Label
                </label>
                <input
                  type="text"
                  placeholder="e.g., Stockroom Generator Refueling"
                  value={vm.formData.title}
                  onChange={(e) =>
                    vm.setFormData({ ...vm.formData, title: e.target.value })
                  }
                  className={inputClass("title")}
                />
                {vm.errors.title && (
                  <p className="text-rose-500 text-[11px] font-bold mt-1">
                    {vm.errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Account Category
                  </label>
                  <select
                    value={vm.formData.category}
                    onChange={(e) =>
                      vm.setFormData({
                        ...vm.formData,
                        category: e.target.value as any,
                      })
                    }
                    className={inputClass("category")}
                  >
                    <option value="GENERAL">General Expense</option>
                    <option value="OPEX">Operating (OPEX)</option>
                    <option value="COGS">Cost of Goods (COGS)</option>
                    <option value="MARKETING">Marketing / Ads</option>
                    <option value="PAYROLL">Payroll / Wages</option>
                    <option value="CAPEX">Capital Assets (CAPEX)</option>
                    <option value="TAX">Taxes / Levies</option>
                    <option value="UTILITIES">Utilities / Internet</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Outflow Magnitude (UGX)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 450000"
                    value={vm.formData.amount}
                    onChange={(e) =>
                      vm.setFormData({ ...vm.formData, amount: e.target.value })
                    }
                    className={inputClass("amount")}
                  />
                </div>
              </div>
              {vm.errors.amount && (
                <p className="text-rose-500 text-[11px] font-bold mt-1">
                  {vm.errors.amount}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Posting Date
                  </label>
                  <input
                    type="date"
                    value={vm.formData.expenseDate}
                    onChange={(e) =>
                      vm.setFormData({
                        ...vm.formData,
                        expenseDate: e.target.value,
                      })
                    }
                    className={inputClass("expenseDate")}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Settlement Channel
                  </label>
                  <select
                    value={vm.formData.paymentMethod}
                    onChange={(e) =>
                      vm.setFormData({
                        ...vm.formData,
                        paymentMethod: e.target.value as any,
                      })
                    }
                    className={inputClass("paymentMethod")}
                  >
                    <option value="CASH">Liquid Cash</option>
                    <option value="BANK_TRANSFER">Bank EFT / Wire</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CREDIT">Vendor Credit Accord</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Recipient Vendor / Entity
                </label>
                <input
                  type="text"
                  placeholder="e.g., National Water & Sewerage Corp"
                  value={vm.formData.vendor}
                  onChange={(e) =>
                    vm.setFormData({ ...vm.formData, vendor: e.target.value })
                  }
                  className={inputClass("vendor")}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Audit trail supplementary notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record reconciliation notes or transaction voucher reference tags..."
                  value={vm.formData.notes}
                  onChange={(e) =>
                    vm.setFormData({ ...vm.formData, notes: e.target.value })
                  }
                  className={`${inputClass("notes")} resize-none`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={vm.loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white py-3 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-600/10  mt-2"
            >
              {vm.editingUuid
                ? "Apply Ledger Modification"
                : "Save Financial Ledger Entry"}
            </button>
          </form>

          {/* RIGHT INTERFACE COLUMN: REALTIME SEARCHABLE LEDGER MATRIX STATEMENT STREAM */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Filter Ledger Search Ribbon Row */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Query matrix entries by resource tag, taxonomy type, or transaction notes..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                  value={vm.searchTerm}
                  onChange={(e) => vm.setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Core Ledger Presentation Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50/50 dark:bg-zinc-950/50 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Transaction Scope Details</th>
                    <th className="px-6 py-4">Classification</th>
                    <th className="px-6 py-4">
                      <Wallet size={12} className="inline mr-1" />
                      Settlement Matrix
                    </th>
                    <th className="px-6 py-4 text-right">
                      Disbursement Outflow
                    </th>
                    <th className="px-6 py-4 text-right">Matrix Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 dark:text-zinc-300 text-sm">
                  {vm.loading ? (
                    <TableRowSkeleton />
                  ) : vm.expensesList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-zinc-400 text-xs italic"
                      >
                        No financial outgoings documented inside localized
                        parameters search paths.
                      </td>
                    </tr>
                  ) : (
                    vm.expensesList.map((expense) => {
                      // High-contrast highlighting for warning values (> 1,000,000 UGX) inside audit tracking grids
                      const isHeavyOutflow = expense.amount >= 1000000;
                      return (
                        <tr
                          key={expense.uuid}
                          className={`transition-colors group ${
                            isHeavyOutflow
                              ? "bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/10 dark:hover:bg-rose-900/20"
                              : "hover:bg-zinc-50/50 dark:hover:bg-zinc-950/40"
                          }`}
                        >
                          <td className="px-6 py-4 max-w-[240px]">
                            <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
                              <FileText
                                size={14}
                                className="text-zinc-400 flex-shrink-0"
                              />{" "}
                              {expense.title}
                            </p>
                            {expense.notes && (
                              <p className="text-xs text-zinc-400 mt-1 line-clamp-1 italic">
                                {expense.notes}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono mt-1.5">
                              <span className="flex items-center gap-0.5">
                                <Calendar size={10} /> {expense.expenseDate}
                              </span>
                              {expense.vendor && (
                                <span className="flex items-center gap-0.5">
                                  <UserPlus size={10} /> {expense.vendor}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <CategoryBadge category={expense.category} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-zinc-500 dark:text-zinc-400">
                            {expense.paymentMethod.replace("_", " ")}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-right font-mono font-black text-xs ${isHeavyOutflow ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-200"}`}
                          >
                            {formatUGX(expense.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => vm.startEdit(expense)}
                                className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                title="Edit ledger line context"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Confirm removal of this disbursement record from ledger indexes?",
                                    )
                                  ) {
                                    vm.deleteExpense(expense.uuid);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600"
                                title="Strike out ledger transaction entry"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component Context Segment Row */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
              <Pagination
                currentPage={vm.currentPage}
                totalPages={vm.totalPages}
                pageSize={vm.pageSize}
                totalCount={vm.totalCount}
                onPageChange={vm.setCurrentPage}
                onPageSizeChange={vm.setPageSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
