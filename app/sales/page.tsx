"use client";

import {
  ShoppingCart,
  CreditCard,
  Plus,
  Minus,
  Package,
  User,
  Trash2,
  Percent,
} from "lucide-react";
import { SearchableDropdown } from "@luciodale/react-searchable-dropdown";
import "@luciodale/react-searchable-dropdown/dist/assets/single-style.css";
import { useSalesViewModel } from "./useSalesViewModel";

const formatUGX = (amount: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function NewSalePage() {
  const vm = useSalesViewModel();

  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-zinc-950 border px-3 py-2 text-sm outline-none transition-all
    ${vm.errors[fieldName] ? "border-rose-500 ring-1 ring-rose-500/20" : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"}
  `;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-2">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          {/* Left Panel: Catalog & Configuration */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h2 className="text-xs font-black uppercase text-zinc-400 mb-6 flex items-center gap-2 tracking-widest">
                <Package size={16} /> Catalog Selection
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Search Item
                  </label>
                  <SearchableDropdown
                    options={vm.productOptions.map((p) => p.name)}
                    value={
                      vm.productOptions.find(
                        (p) => p.uuid === vm.selectedProductUuid,
                      )?.name || ""
                    }
                    setValue={(val: string) => {
                      const selected = vm.productOptions.find(
                        (p) => p.name === val,
                      );
                      vm.setSelectedProductUuid(selected?.uuid || "");
                      vm.setSelectedVariantUuid("");
                    }}
                    placeholder="Enter product name..."
                  />
                </div>

                {vm.selectedProductUuid && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 animate-in fade-in slide-in-from-top-1">
                    {vm.availableVariants.length > 0 && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                          Variant
                        </label>
                        <select
                          value={vm.selectedVariantUuid}
                          onChange={(e) =>
                            vm.setSelectedVariantUuid(e.target.value)
                          }
                          className={inputClass("variant")}
                        >
                          <option value="">Standard</option>
                          {vm.availableVariants.map((v) => (
                            <option key={v.uuid} value={v.uuid}>
                              {v.label} ({formatUGX(v.price)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                          Qty
                        </label>
                        <input
                          type="number"
                          value={vm.quantityToAdd}
                          onChange={(e) =>
                            vm.setQuantityToAdd(parseFloat(e.target.value) || 1)
                          }
                          className={inputClass("quantity")}
                        />
                      </div>
                      <button
                        onClick={vm.addToCart}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-[42px] px-6 font-bold transition-all active:scale-95 shadow-md shadow-blue-600/10"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h2 className="text-xs font-black uppercase text-zinc-400 mb-6 flex items-center gap-2 tracking-widest">
                <User size={16} /> Transaction Meta
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Customer
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
                    placeholder="Walk-in Customer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                      Type
                    </label>
                    <select
                      value={vm.saleType}
                      onChange={(e) => vm.setSaleType(e.target.value as any)}
                      className={inputClass("type")}
                    >
                      <option value="DIRECT">Direct</option>
                      <option value="INVOICE">Invoice</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                      Status
                    </label>
                    <select
                      value={vm.saleStatus}
                      onChange={(e) => vm.setSaleStatus(e.target.value as any)}
                      className={inputClass("status")}
                    >
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Discount Section Divider */}
              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent size={14} className="text-zinc-400" />
                    <span className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">
                      Apply Campaign Discount
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={vm.isDiscountEnabled}
                      onChange={(e) => {
                        vm.setIsDiscountEnabled(e.target.checked);
                        if (!e.target.checked) vm.setSelectedDiscountUuid("");
                      }}
                    />
                    <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Conditional Discount Picker Dropdown */}
                {vm.isDiscountEnabled && (
                  <div className="animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                      Select Voucher/Discount Code
                    </label>
                    <select
                      value={vm.selectedDiscountUuid}
                      onChange={(e) =>
                        vm.setSelectedDiscountUuid(e.target.value)
                      }
                      className={inputClass("discount_id")}
                    >
                      <option value="">-- Choose Campaign --</option>
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
            </div>
          </div>

          {/* Right Panel: Checkout / Cart Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden sticky top-6">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 dark:text-white">
                  <ShoppingCart size={18} /> Order Queue
                </h3>
                <button
                  onClick={vm.resetForm}
                  className="text-[10px] font-bold text-zinc-400 hover:text-rose-500 uppercase tracking-tighter transition"
                >
                  Reset Cart
                </button>
              </div>

              <div className="p-5 min-h-[250px] space-y-3">
                {vm.cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-zinc-400">
                    <ShoppingCart size={40} className="opacity-10 mb-2" />
                    <p className="text-xs font-bold uppercase">Cart is empty</p>
                  </div>
                ) : (
                  vm.cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800"
                    >
                      <div>
                        <p className="text-sm font-bold dark:text-white">
                          {item.product_name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {item.variant_label || "Standard"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                          <button
                            onClick={() =>
                              vm.updateCartItemQuantity(idx, item.quantity - 1)
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
                              vm.updateCartItemQuantity(idx, item.quantity + 1)
                            }
                            className="p-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <button
                          onClick={() => vm.removeCartItem(idx)}
                          className="text-rose-500 hover:text-rose-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t-2 border-zinc-100 dark:border-zinc-800 space-y-4">
                {/* Breakdowns */}
                <div className="flex justify-between text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span>{formatUGX(vm.subtotalAmount)}</span>
                </div>
                {vm.discountAmount > 0 && (
                  <div className="flex justify-between text-xs font-bold uppercase text-rose-500">
                    <span>Discount Applied</span>
                    <span>-{formatUGX(vm.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end border-t border-zinc-200 dark:border-zinc-800 pt-3">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                    Grand Total
                  </span>
                  <span className="text-3xl font-black dark:text-white">
                    {formatUGX(vm.totalAmount)}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Payment Captured
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 underline underline-offset-2">
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
                </div>

                <button
                  onClick={vm.saveSale}
                  disabled={vm.cartItems.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white py-4 font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                >
                  <CreditCard size={18} className="inline mr-2" />
                  {vm.saleType === "INVOICE"
                    ? "Generate Invoice"
                    : "Complete Sale"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
