"use client";

import {
  ShoppingCart,
  CreditCard,
  Plus,
  Minus,
  Wrench,
  User,
  Trash2,
  Clock,
  Coins,
  Percent,
} from "lucide-react";
import { SearchableDropdown } from "@luciodale/react-searchable-dropdown";
import "@luciodale/react-searchable-dropdown/dist/assets/single-style.css";
import { useServiceSalesViewModel } from "./useServiceSalesViewModel";

const formatUGX = (amount: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ServiceSalesPage() {
  const vm = useServiceSalesViewModel();

  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-zinc-950 border px-3 py-2 text-sm outline-none transition-all
    ${vm.errors[fieldName] ? "border-rose-500 ring-1 ring-rose-500/20" : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"}
  `;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black px-2">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          {/* Left Panel: Catalog Search & Context Meta */}
          <div className="lg:col-span-7 space-y-6">
            {/* Catalog Selection */}
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h2 className="text-xs font-black uppercase text-zinc-400 mb-6 flex items-center gap-2 tracking-widest">
                <Wrench size={16} /> Service Catalog Selection
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Search Service Offerings
                  </label>
                  <SearchableDropdown
                    options={vm.serviceOptions.map((s) => s.name)}
                    value={
                      vm.serviceOptions.find(
                        (s) => s.uuid === vm.selectedServiceUuid,
                      )?.name || ""
                    }
                    setValue={(val: string) => {
                      const selected = vm.serviceOptions.find(
                        (s) => s.name === val,
                      );
                      vm.setSelectedServiceUuid(selected?.uuid || "");
                      vm.setSelectedVariantUuid("");
                    }}
                    placeholder="Type service name (e.g., Car Washing, Maintenance)..."
                  />
                  {vm.errors.service && (
                    <p className="text-rose-500 text-[11px] font-bold mt-1">
                      {vm.errors.service}
                    </p>
                  )}
                </div>

                {vm.selectedServiceUuid && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-zinc-850/40 animate-in fade-in slide-in-from-top-1">
                    {vm.availableVariants.length > 0 && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                          Service Configuration Tier
                        </label>
                        <select
                          value={vm.selectedVariantUuid}
                          onChange={(e) =>
                            vm.setSelectedVariantUuid(e.target.value)
                          }
                          className={inputClass("variant")}
                        >
                          <option value="">-- Choose Tier Options --</option>
                          {vm.availableVariants.map((v) => (
                            <option key={v.uuid} value={v.uuid}>
                              {v.label} ({formatUGX(v.calculatedPrice)}
                              {v.rentalUnit ? ` per ${v.rentalUnit}` : ""})
                            </option>
                          ))}
                        </select>
                        {vm.errors.variant && (
                          <p className="text-rose-500 text-[11px] font-bold mt-1">
                            {vm.errors.variant}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 items-end md:col-span-1">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                          Quantity / Booking Units
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={vm.quantityToAdd}
                          onChange={(e) =>
                            vm.setQuantityToAdd(
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          className={inputClass("quantity")}
                        />
                      </div>
                      <button
                        onClick={vm.addToCart}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-6 font-bold transition-all active:scale-95 shadow-md shadow-blue-600/10"
                      >
                        Queue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Metadata Card */}
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h2 className="text-xs font-black uppercase text-zinc-400 mb-6 flex items-center gap-2 tracking-widest">
                <User size={16} /> Client Assignment & Workflow
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Associated Account Profile
                  </label>
                  <SearchableDropdown
                    options={vm.customers.map(
                      (c) => `${c.first_name} ${c.last_name}`,
                    )}
                    value={
                      vm.selectedCustomer
                        ? `${vm.selectedCustomer.first_name} ${vm.selectedCustomer.last_name}`
                        : ""
                    }
                    setValue={(val: string) => {
                      const matched = vm.customers.find(
                        (c) => `${c.first_name} ${c.last_name}` === val,
                      );
                      vm.setSelectedCustomer(matched || null);
                    }}
                    placeholder="Walk-in Customer / Guest Profile"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                      Billing Flow
                    </label>
                    <select
                      value={vm.saleType}
                      onChange={(e) => vm.setSaleType(e.target.value as any)}
                      className={inputClass("type")}
                    >
                      <option value="DIRECT">Direct Sale</option>
                      <option value="INVOICE">Deferred Invoice</option>
                      <option value="APPOINTMENT">Appointment Order</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                      Execution State
                    </label>
                    <select
                      value={vm.saleStatus}
                      onChange={(e) => vm.setSaleStatus(e.target.value as any)}
                      className={inputClass("status")}
                    >
                      <option value="COMPLETED">Settled & Closed</option>
                      <option value="PENDING">Pending Delivery</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Order Queue Checkout Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden sticky top-6">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 dark:text-white text-sm">
                  <ShoppingCart size={18} className="text-zinc-500" /> Service
                  Queue Pipeline
                </h3>
                <button
                  onClick={vm.resetForm}
                  className="text-[10px] font-bold text-zinc-400 hover:text-rose-500 uppercase tracking-tighter transition"
                >
                  Flush Cart
                </button>
              </div>

              {/* Cart Queue Listing */}
              <div className="p-5 min-h-[200px] space-y-3 max-h-[350px] overflow-y-auto">
                {vm.cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[180px] text-zinc-400">
                    <ShoppingCart size={40} className="opacity-10 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">
                      No Services Queued
                    </p>
                  </div>
                ) : (
                  vm.cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold dark:text-white leading-tight">
                            {item.service_name}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                            {item.variant_label
                              ? `${item.variant_label}`
                              : "Base Offering Tier"}
                          </p>
                        </div>
                        <span className="text-xs font-black dark:text-zinc-300">
                          {formatUGX(item.subtotal)}
                        </span>
                      </div>

                      {/* Display contextual metadata badges if item is registered as a rental */}
                      {item.is_rental && (
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase py-1 text-blue-600 dark:text-blue-400">
                          <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 border border-blue-100 dark:border-blue-900/40">
                            <Clock size={10} /> Rental Unit:{" "}
                            {item.rental_unit || "N/A"}
                          </span>
                          {item.deposit_required > 0 && (
                            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 border border-amber-100 dark:border-amber-900/30">
                              <Coins size={10} /> Deposit:{" "}
                              {formatUGX(item.deposit_required)}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                        <span className="text-[10px] text-zinc-400 font-medium">
                          Rate: {formatUGX(item.unit_price)}
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <button
                              onClick={() =>
                                vm.updateCartItemQuantity(
                                  idx,
                                  item.quantity - 1,
                                )
                              }
                              className="p-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="px-2 text-xs font-black dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                vm.updateCartItemQuantity(
                                  idx,
                                  item.quantity + 1,
                                )
                              }
                              className="p-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                          <button
                            onClick={() => vm.removeCartItem(idx)}
                            className="text-rose-500 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals & Financial Entry Operations Footer Area */}
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t-2 border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Subtotal</span>
                    <span>{formatUGX(vm.subtotalAmount)}</span>
                  </div>
                  {vm.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-500 font-black uppercase tracking-wider">
                      <span>Discount Applied</span>
                      <span>-{formatUGX(vm.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                      Pipeline Net Total
                    </span>
                    <span className="text-3xl font-black dark:text-white tracking-tight">
                      {formatUGX(vm.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Extended Interactive Service Markdown Engine Toggle Box */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableServiceDiscount"
                      checked={vm.isDiscountEnabled}
                      onChange={(e) =>
                        vm.setIsDiscountEnabled(e.target.checked)
                      }
                      className="rounded dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 accent-blue-600"
                    />
                    <label
                      htmlFor="enableServiceDiscount"
                      className="text-xs font-black uppercase text-zinc-600 dark:text-zinc-400 cursor-pointer flex items-center gap-1.5"
                    >
                      <Percent size={14} className="text-blue-500" /> Apply
                      Service Markdown
                    </label>
                  </div>

                  {vm.isDiscountEnabled && (
                    <div className="animate-in fade-in slide-in-from-top-1">
                      <select
                        value={vm.selectedDiscountUuid}
                        onChange={(e) =>
                          vm.setSelectedDiscountUuid(e.target.value)
                        }
                        className={inputClass("discount_id")}
                      >
                        <option value="">-- Choose Campaign Discount --</option>
                        {vm.discountsList.map((d) => (
                          <option key={d.uuid} value={d.uuid}>
                            {d.name} (
                            {d.type === "PERCENTAGE"
                              ? `${d.value}% Off`
                              : `${formatUGX(d.value)} Off`}
                            )
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Cash Received / Payments Captured
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      UGX
                    </span>
                    <input
                      type="text"
                      value={vm.amountPaidRaw}
                      onChange={(e) =>
                        vm.setAmountPaidRaw(
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-12 pr-4 py-3 text-xl font-black focus:ring-4 focus:ring-blue-500/5 outline-none dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  {vm.errors.amount_paid && (
                    <p className="text-rose-500 text-[11px] font-bold mt-1">
                      {vm.errors.amount_paid}
                    </p>
                  )}
                  {vm.errors.general && (
                    <p className="text-rose-500 text-[11px] font-bold mt-1">
                      {vm.errors.general}
                    </p>
                  )}
                </div>

                <button
                  onClick={vm.saveSale}
                  disabled={vm.cartItems.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white py-4 font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/10"
                >
                  <CreditCard size={18} className="inline mr-2" />
                  {vm.saleType === "INVOICE"
                    ? "Generate Service Invoice"
                    : "Complete Booking Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
