"use client";

import {
  Search,
  Plus,
  Tag,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Trash2,
  Edit2,
  RotateCcw,
} from "lucide-react";
import { TableRowSkeleton } from "../../components/Skeletons";
import { Pagination } from "../../components/Pagination";
import { useDiscountsViewModel } from "./useDiscountsViewModel";

const formatValueDisplay = (value: number, type: "PERCENTAGE" | "FIXED") => {
  if (type === "PERCENTAGE") return `${Number(value)}%`;
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function DiscountsManagementPage() {
  const vm = useDiscountsViewModel();

  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-zinc-950 border px-3 py-2 text-sm outline-none transition-all 
    ${vm.errors[fieldName] ? "border-rose-500 ring-1 ring-rose-500/20" : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"}
  `;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-2">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Master Row Layout Columns split view */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
          {/* LEFT COLUMN: EDIT/CREATE DATA BOUND CONTROL PANEL */}
          <form
            onSubmit={vm.handleSave}
            className="lg:col-span-4 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5"
          >
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-xs font-black uppercase text-zinc-400 flex items-center gap-2 tracking-widest">
                <Plus size={16} />{" "}
                {vm.editingUuid
                  ? "Update Pricing Schema"
                  : "New Promotion Matrix"}
              </h2>
              {vm.editingUuid && (
                <button
                  type="button"
                  onClick={vm.resetForm}
                  className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                  title="Cancel editing"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Campaign Rule Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Black Friday Flash Campaign"
                  value={vm.formData.name}
                  onChange={(e) =>
                    vm.setFormData({ ...vm.formData, name: e.target.value })
                  }
                  className={inputClass("name")}
                />
                {vm.errors.name && (
                  <p className="text-rose-500 text-[11px] font-bold mt-1">
                    {vm.errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Calculation Model
                  </label>
                  <select
                    value={vm.formData.type}
                    onChange={(e) =>
                      vm.setFormData({
                        ...vm.formData,
                        type: e.target.value as any,
                      })
                    }
                    className={inputClass("type")}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (UGX)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Valuation Rate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 20"
                    value={vm.formData.value}
                    onChange={(e) =>
                      vm.setFormData({ ...vm.formData, value: e.target.value })
                    }
                    className={inputClass("value")}
                  />
                </div>
              </div>
              {vm.errors.value && (
                <p className="text-rose-500 text-[11px] font-bold mt-1">
                  {vm.errors.value}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Valid Commencement
                  </label>
                  <input
                    type="date"
                    value={vm.formData.startDate}
                    onChange={(e) =>
                      vm.setFormData({
                        ...vm.formData,
                        startDate: e.target.value,
                      })
                    }
                    className={inputClass("startDate")}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Termination Expiry
                  </label>
                  <input
                    type="date"
                    value={vm.formData.endDate}
                    onChange={(e) =>
                      vm.setFormData({
                        ...vm.formData,
                        endDate: e.target.value,
                      })
                    }
                    className={inputClass("endDate")}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={vm.formData.isActive}
                  onChange={(e) =>
                    vm.setFormData({
                      ...vm.formData,
                      isActive: e.target.checked,
                    })
                  }
                  className=" border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="isActiveToggle"
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-400 select-none"
                >
                  Deploy as immediately active
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={vm.loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white py-3 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-600/10 mt-2"
            >
              {vm.editingUuid
                ? "Apply Modification Parameters"
                : "Save Discount Parameters"}
            </button>
          </form>

          {/* RIGHT COLUMN: SEARCHABLE LOCAL LOGS DATABASE TABLE */}
          <div className="lg:col-span-8 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-sm  overflow-hidden">
            {/* Filter Search Input Control Section */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Filter local records index logs by identifier descriptions..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm outline-none  focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                  value={vm.searchTerm}
                  onChange={(e) => vm.setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Matrix Data Ledger Trail Output View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50/50 dark:bg-zinc-950/50 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Campaign Model Schema</th>
                    <th className="px-6 py-4">Adjustment Value</th>
                    <th className="px-6 py-4">
                      <Calendar size={12} className="inline mr-1" />
                      Validation Pipeline
                    </th>
                    <th className="px-6 py-4 text-right">
                      Actions Matrix Operations
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 dark:text-zinc-300 text-sm">
                  {vm.loading ? (
                    <TableRowSkeleton />
                  ) : vm.discountsList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-zinc-400 text-xs italic"
                      >
                        No custom discount matrices match selected filters.
                      </td>
                    </tr>
                  ) : (
                    vm.discountsList.map((discount) => (
                      <tr
                        key={discount.uuid}
                        className={`transition-colors ${
                          !discount.isActive
                            ? "bg-zinc-100/40 opacity-60 dark:bg-zinc-950/20"
                            : "hover:bg-zinc-50/50 dark:hover:bg-zinc-950/40"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <Tag size={14} className="text-zinc-400" />{" "}
                            {discount.name}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-xs">
                          <span
                            className={`px-2 py-0.5 ${discount.type === "PERCENTAGE" ? "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400" : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"}`}
                          >
                            {formatValueDisplay(discount.value, discount.type)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-zinc-400 space-y-0.5">
                          <p>
                            <span className="text-zinc-400 font-medium">
                              Start:
                            </span>{" "}
                            {discount.startDate
                              ? new Date(
                                  discount.startDate,
                                ).toLocaleDateString()
                              : "Immediate execution"}
                          </p>
                          <p>
                            <span className="text-zinc-400 font-medium">
                              End:
                            </span>{" "}
                            {discount.endDate
                              ? new Date(discount.endDate).toLocaleDateString()
                              : "Infinite window"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                vm.toggleDiscountState(
                                  discount.uuid,
                                  discount.isActive,
                                )
                              }
                              className={`p-1 transition-all ${discount.isActive ? "text-emerald-500 hover:text-emerald-600" : "text-zinc-400 hover:text-zinc-500"}`}
                              title={
                                discount.isActive
                                  ? "Pause deployment rule"
                                  : "Activate rule"
                              }
                            >
                              {discount.isActive ? (
                                <ToggleRight size={22} />
                              ) : (
                                <ToggleLeft size={22} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => vm.startEdit(discount)}
                              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 "
                              title="Modify strategy details"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Confirm removal of this configuration matrix?",
                                  )
                                ) {
                                  vm.deleteDiscount(discount.uuid);
                                }
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 "
                              title="Delete model entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component Controller Row */}
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
