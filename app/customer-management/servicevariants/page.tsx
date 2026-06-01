"use client";

import {
  Edit2,
  Trash2,
  Layers,
  DollarSign,
  Clock,
  Package,
  Search,
  Plus,
  XCircle,
  Tag,
  Truck,
} from "lucide-react";
import { useServiceVariantViewModel } from "./useServiceVariantViewModel";
import { FormSkeleton, TableRowSkeleton } from "../../components/Skeletons";
import { Pagination } from "../../components/Pagination";
import { SearchableDropdown } from "@luciodale/react-searchable-dropdown";
import "@luciodale/react-searchable-dropdown/dist/assets/single-style.css";

export default function ServiceVariantsPage() {
  const {
    variantsList,
    servicesList,
    loading,
    editingUuid,
    errors,
    formData,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setPageSize,
    setCurrentPage,
    setFormData,
    handleSave,
    deleteVariant,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
  } = useServiceVariantViewModel();

  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-black border px-3 py-2 text-sm outline-none transition-all
    ${
      errors[fieldName]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black px-2 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* SIDEBAR FORM */}
        <section className="lg:col-span-4 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm h-fit sticky top-6">
          {loading ? (
            <FormSkeleton />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-2">
                  <Layers size={16} />{" "}
                  {editingUuid ? "Edit Variant" : "New Variant"}
                </h2>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                    Variant Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Premium, 2 Hours, Weekend"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={inputClass("name")}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Service *
                    </label>
                    <SearchableDropdown
                      options={servicesList.map((s) => s.name)}
                      value={
                        servicesList.find((s) => s.uuid === formData.service_id)
                          ?.name || ""
                      }
                      setValue={(val: string) => {
                        const selected = servicesList.find(
                          (s) => s.name === val,
                        );
                        setFormData({
                          ...formData,
                          service_id: selected?.uuid || "",
                        });
                      }}
                      placeholder="Search service..."
                      createNewOptionIfNoMatch={false}
                      dropdownOptionNoMatchLabel="No service found"
                      dropdownOptionsHeight={320}
                      debounceDelay={100}
                    />
                    {errors.service_id && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.service_id}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      SKU
                    </label>
                    <input
                      type="text"
                      placeholder="Optional SKU"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      className={inputClass("sku")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Price Adjust (+/-)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_adjustment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price_adjustment: Number(e.target.value),
                        })
                      }
                      className={inputClass("price_adjustment")}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Absolute Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Overrides base"
                      value={formData.absolute_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          absolute_price: e.target.value,
                        })
                      }
                      className={inputClass("absolute_price")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      placeholder="Override service duration"
                      value={formData.duration_minutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_minutes: e.target.value,
                        })
                      }
                      className={inputClass("duration_minutes")}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Rental Rate Unit
                    </label>
                    <select
                      value={formData.rental_rate_unit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rental_rate_unit: e.target.value,
                        })
                      }
                      className={inputClass("rental_rate_unit")}
                    >
                      <option value="hour">Hour</option>
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Deposit Required
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-2.5 top-2.5 text-zinc-400"
                        size={14}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.deposit_required}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deposit_required: e.target.value,
                          })
                        }
                        className={`${inputClass("deposit_required")} pl-8`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Late Fee (per unit)
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-2.5 top-2.5 text-zinc-400"
                        size={14}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.late_fee_per_unit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            late_fee_per_unit: e.target.value,
                          })
                        }
                        className={`${inputClass("late_fee_per_unit")} pl-8`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Available Quantity
                    </label>
                    <input
                      type="number"
                      placeholder="-1 = unlimited"
                      value={formData.available_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          available_quantity: Number(e.target.value),
                        })
                      }
                      className={inputClass("available_quantity")}
                    />
                    <p className="text-[9px] text-zinc-400 mt-0.5">
                      Use -1 for unlimited
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Min Stock Level
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.minimum_stock_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimum_stock_level: Number(e.target.value),
                        })
                      }
                      className={inputClass("minimum_stock_level")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className={`${inputClass("description")} resize-none`}
                  />
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className=" border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-transparent"
                  />
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Active Variant
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                >
                  {editingUuid ? <Edit2 size={18} /> : <Plus size={18} />}
                  {editingUuid ? "Update Variant" : "Create Variant"}
                </button>
                {editingUuid && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full text-zinc-500 dark:text-zinc-400 text-xs font-bold py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors mt-1"
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          )}
        </section>

        {/* MAIN TABLE SECTION */}
        <section className="lg:col-span-8">
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th colSpan={5} className="px-6 py-4">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Search variants..."
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border-none pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </th>
                </tr>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 text-xs font-black">
                    Variant Details
                  </th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Pricing & Time</th>
                  <th className="px-6 py-4">Inventory & Rental</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading ? (
                  <TableRowSkeleton />
                ) : (
                  variantsList.map((variant) => (
                    <tr
                      key={variant.uuid}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 group transition-colors text-xs"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            {variant.name}
                            {!variant.is_active && (
                              <XCircle size={12} className="text-red-400" />
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Tag size={10} /> {variant.sku || "No SKU"}
                          </span>
                          {variant.description && (
                            <span className="text-[9px] text-zinc-400 mt-1 line-clamp-1">
                              {variant.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-zinc-600 dark:text-zinc-300">
                          {servicesList.find(
                            (s) => s.uuid === variant.service_id,
                          )?.name || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-zinc-500">
                          <span className="flex items-center gap-1.5">
                            <DollarSign size={12} className="text-green-500" />
                            {variant.absolute_price ? (
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                ${variant.absolute_price}
                              </span>
                            ) : (
                              <span>
                                {variant.price_adjustment >= 0 ? "+" : ""}
                                {variant.price_adjustment} from base
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} />{" "}
                            {variant.duration_minutes || "—"} mins
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Package size={12} />
                            <span className="text-[10px] font-medium">
                              {variant.available_quantity === -1
                                ? "Unlimited"
                                : `${variant.available_quantity} avail`}
                            </span>
                            {variant.minimum_stock_level > 0 && (
                              <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 px-1">
                                Min: {variant.minimum_stock_level}
                              </span>
                            )}
                          </div>
                          {(variant.deposit_required > 0 ||
                            variant.late_fee_per_unit > 0) && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Truck size={12} />
                              {variant.deposit_required > 0 && (
                                <span className="text-[10px]">
                                  Deposit: ${variant.deposit_required}
                                </span>
                              )}
                              {variant.late_fee_per_unit > 0 && (
                                <span className="text-[10px]">
                                  Late: ${variant.late_fee_per_unit}
                                </span>
                              )}
                            </div>
                          )}
                          {variant.rental_rate_unit &&
                            variant.rental_rate_unit !== "hour" && (
                              <span className="text-[9px] text-purple-500">
                                Rate: {variant.rental_rate_unit}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(variant)}
                            className="p-2 text-zinc-400 hover:text-blue-500"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteVariant(variant.uuid)}
                            className="p-2 text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-black"
                  >
                    {!loading && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                      />
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
