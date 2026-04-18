"use client";

import React, { useState } from "react";
import {
  Trash2,
  ShoppingCart,
  CreditCard,
  Plus,
  Minus,
  Search,
  Eye,
  XCircle,
  CheckCircle,
  Package,
  User,
  X,
} from "lucide-react";
import { SearchableDropdown } from "@luciodale/react-searchable-dropdown";
import "@luciodale/react-searchable-dropdown/dist/assets/single-style.css";
import { Tabs } from "../components/Tabs";
import { useSalesViewModel } from "./useSalesViewModel";
import { TableRowSkeleton } from "../components/Skeletons";
import { Pagination } from "../components/Pagination";

const formatUGX = (amount: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Sale Details Dialog Component
function SaleDetailsDialog({
  saleUuid,
  isOpen,
  onClose,
  onPaymentUpdated,
}: {
  saleUuid: string | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated: () => void;
}) {
  const { getSaleDetails, updateSalePayment } = useSalesViewModel();
  const [sale, setSale] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = async () => {
    if (!saleUuid) return;
    setLoading(true);
    try {
      const { sale: saleData, items: saleItems } =
        await getSaleDetails(saleUuid);
      setSale(saleData);
      setItems(saleItems);
      setAmountPaid(String(saleData.amount_paid));
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load sale details");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && saleUuid) {
      fetchDetails();
    }
  }, [isOpen, saleUuid]);

  const handleUpdatePayment = async () => {
    if (!saleUuid) return;
    const newAmount = parseFloat(amountPaid);
    if (isNaN(newAmount)) {
      setError("Please enter a valid amount");
      return;
    }
    if (newAmount < 0) {
      setError("Amount cannot be negative");
      return;
    }
    if (newAmount > sale.total_amount) {
      setError(`Amount cannot exceed total (${formatUGX(sale.total_amount)})`);
      return;
    }
    try {
      await updateSalePayment(saleUuid, newAmount);
      onPaymentUpdated();
      onClose();
    } catch (err) {
      setError("Failed to update payment");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/40 dark:bg-black/40 backdrop-blur-none">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-black uppercase flex items-center gap-2">
            <Eye size={20} /> Sale Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : sale ? (
            <>
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Sale ID
                  </span>
                  <p className="font-mono text-sm">
                    {sale.uuid.slice(0, 8)}...
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Date
                  </span>
                  <p>{new Date(sale.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Customer
                  </span>
                  <p>{sale.customer_name || "Walk-in Customer"}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Type
                  </span>
                  <p>{sale.type}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Status
                  </span>
                  <p>
                    {sale.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle size={12} /> COMPLETED
                      </span>
                    ) : sale.status === "PENDING" ? (
                      <span className="inline-flex items-center gap-1 text-yellow-600">
                        <Clock size={12} /> PENDING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500">
                        <XCircle size={12} /> CANCELLED
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-sm font-bold mb-2">Items</h3>
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 text-xs">
                    <tr>
                      <th className="px-2 py-1 text-left">Product</th>
                      <th className="px-2 py-1 text-right">Qty</th>
                      <th className="px-2 py-1 text-right">Unit Price</th>
                      <th className="px-2 py-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-zinc-100 dark:border-zinc-800"
                      >
                        <td className="px-2 py-1">
                          {item.product_name}
                          {item.variant_type && (
                            <span className="text-xs text-zinc-500 block">
                              {item.variant_type}: {item.variant_value}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatUGX(item.unit_price)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatUGX(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50 dark:bg-zinc-800 font-bold">
                    <tr>
                      <td colSpan={3} className="px-2 py-1 text-right">
                        Total:
                      </td>
                      <td className="px-2 py-1 text-right">
                        {formatUGX(sale.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Editing */}
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                <h3 className="text-sm font-bold mb-3">Payment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-sm"
                      step="0.01"
                      min="0"
                      max={sale.total_amount}
                    />
                    {error && (
                      <p className="text-xs text-red-500 mt-1">{error}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">
                      Remaining Balance
                    </label>
                    <p className="text-lg font-bold">
                      {formatUGX(
                        Math.max(
                          0,
                          sale.total_amount - (parseFloat(amountPaid) || 0),
                        ),
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={handleUpdatePayment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold text-sm"
                  >
                    Update Payment
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Helper Clock icon
const Clock = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function SalesPage() {
  const {
    salesList,
    loading,
    cartItems,
    selectedCustomer,
    customers,
    saleType,
    saleStatus,
    amountPaidRaw,
    setAmountPaidRaw,
    totalAmount,
    errors,
    productOptions,
    selectedProductUuid,
    setSelectedProductUuid,
    selectedVariantUuid,
    setSelectedVariantUuid,
    availableVariants,
    quantityToAdd,
    setQuantityToAdd,
    setSelectedCustomer,
    setSaleType,
    setSaleStatus,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    saveSale,
    resetForm,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setCurrentPage,
    setPageSize,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    activeMainTab,
    setActiveMainTab,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    refreshSales,
  } = useSalesViewModel();

  const [selectedSaleUuid, setSelectedSaleUuid] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewSale = (uuid: string) => {
    setSelectedSaleUuid(uuid);
    setIsDialogOpen(true);
  };

  const handlePaymentUpdated = () => {
    refreshSales();
  };

  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm outline-none transition-all
    ${
      errors[fieldName]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    }
  `;

  const labelClass =
    "block text-[10px] font-bold uppercase mb-1 text-zinc-800 dark:text-zinc-400";

  const mainTabs = [
    { id: "new", label: "New Sale", icon: ShoppingCart },
    { id: "history", label: "Sales History", icon: Eye },
  ];

  const statusTabs = [
    { id: "ALL", label: "All Sales" },
    { id: "COMPLETED", label: "Completed" },
    { id: "PENDING", label: "Pending" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  const isCartEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-2 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Main Tabs */}
        <div className="mb-2">
          <Tabs
            tabs={mainTabs}
            activeTab={activeMainTab}
            onChange={(id) => setActiveMainTab(id as "new" | "history")}
            variant="default"
          />
        </div>

        {/* New Sale Tab */}
        {activeMainTab === "new" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
            {/* LEFT COLUMN: Product Selection & Config */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-2">
                  <h2 className="text-sm font-black uppercase text-zinc-800 dark:text-zinc-300 flex items-center gap-2">
                    <Package size={18} /> Product Selection
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Search Product</label>
                    <SearchableDropdown
                      options={productOptions.map((p) => p.name)}
                      value={
                        productOptions.find(
                          (p) => p.uuid === selectedProductUuid,
                        )?.name || ""
                      }
                      setValue={(val: string) => {
                        const selected = productOptions.find(
                          (p) => p.name === val,
                        );
                        setSelectedProductUuid(selected?.uuid || "");
                        setSelectedVariantUuid("");
                      }}
                      placeholder="Type product name..."
                    />
                    {errors.product && (
                      <p className="text-xs font-bold text-red-600 mt-1">
                        {errors.product}
                      </p>
                    )}
                  </div>

                  {selectedProductUuid && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      {availableVariants.length > 0 && (
                        <div>
                          <label className={labelClass}>Select Variant</label>
                          <select
                            value={selectedVariantUuid}
                            onChange={(e) =>
                              setSelectedVariantUuid(e.target.value)
                            }
                            className={inputClass("variant")}
                          >
                            <option value="">-- Choose --</option>
                            {availableVariants.map((v) => (
                              <option key={v.uuid} value={v.uuid}>
                                {v.label} ({formatUGX(v.price)})
                              </option>
                            ))}
                          </select>
                          {errors.variant && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.variant}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className={labelClass}>Qty</label>
                          <input
                            type="number"
                            value={quantityToAdd}
                            onChange={(e) =>
                              setQuantityToAdd(parseFloat(e.target.value) || 1)
                            }
                            className={inputClass("quantity")}
                          />
                        </div>
                        <button
                          onClick={addToCart}
                          className="bg-zinc-900 dark:bg-blue-600 hover:bg-black text-white px-6 rounded-md h-[40px] font-bold flex items-center gap-2 transition-transform active:scale-95"
                        >
                          <Plus size={18} /> Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Settings */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2">
                <h2 className="text-sm font-black uppercase text-zinc-800 dark:text-zinc-300 flex items-center gap-2 mb-4">
                  <User size={18} /> Sale Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Customer (optional)</label>
                    <SearchableDropdown
                      options={customers.map(
                        (c) => `${c.first_name} ${c.last_name}`,
                      )}
                      value={
                        selectedCustomer
                          ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
                          : ""
                      }
                      setValue={(val: string) => {
                        if (!val) {
                          setSelectedCustomer(null);
                          return;
                        }
                        const matched = customers.find(
                          (c) => `${c.first_name} ${c.last_name}` === val,
                        );
                        setSelectedCustomer(matched || null);
                      }}
                      placeholder="Search customer..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Type</label>
                      <select
                        value={saleType}
                        onChange={(e) =>
                          setSaleType(e.target.value as "DIRECT" | "INVOICE")
                        }
                        className={inputClass("type")}
                      >
                        <option value="DIRECT">Direct</option>
                        <option value="INVOICE">Invoice</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <select
                        value={saleStatus}
                        onChange={(e) =>
                          setSaleStatus(
                            e.target.value as
                              | "COMPLETED"
                              | "PENDING"
                              | "CANCELLED",
                          )
                        }
                        className={inputClass("status")}
                      >
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Cart Summary */}
            <div className="lg:col-span-5 sticky top-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-white p-4 flex justify-between items-center">
                  <h2 className="font-black flex items-center gap-2">
                    <ShoppingCart size={20} /> Current Order
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-[10px] bg-red-600/20 text-red-400 px-2 py-1 rounded hover:bg-red-600 hover:text-white transition"
                  >
                    Reset
                  </button>
                </div>

                <div className="p-4 min-h-[300px]">
                  {isCartEmpty ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                      <ShoppingCart size={48} className="mb-2 opacity-20" />
                      <p className="font-bold">Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cartItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700"
                        >
                          <div>
                            <p className="font-black text-zinc-900 dark:text-white">
                              {item.product_name}
                            </p>
                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400">
                              {item.variant_label || "Standard"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-zinc-300 rounded overflow-hidden">
                              <button
                                onClick={() =>
                                  updateCartItemQuantity(idx, item.quantity - 1)
                                }
                                className="p-1 px-2 bg-white dark:bg-zinc-950 hover:bg-zinc-100"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="px-2 font-bold text-xs">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateCartItemQuantity(idx, item.quantity + 1)
                                }
                                className="p-1 px-2 bg-white dark:bg-zinc-950 hover:bg-zinc-100"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeCartItem(idx)}
                              className="text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t-2 border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-zinc-500 uppercase">
                      Grand Total
                    </span>
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">
                      {formatUGX(totalAmount)}
                    </span>
                  </div>

                  <div>
                    <label className={labelClass}>Payment Received</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                        UGX
                      </span>
                      <input
                        type="text"
                        value={amountPaidRaw}
                        onChange={(e) =>
                          setAmountPaidRaw(
                            e.target.value.replace(/[^0-9.]/g, ""),
                          )
                        }
                        className={`${inputClass("amount_paid")} pl-12 text-lg font-black`}
                        placeholder="0"
                      />
                    </div>
                    {errors.amount_paid && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {errors.amount_paid}
                      </p>
                    )}
                    <div className="text-right text-xs text-zinc-400 mt-1">
                      Remaining:{" "}
                      {formatUGX(
                        Math.max(
                          0,
                          totalAmount - (parseFloat(amountPaidRaw) || 0),
                        ),
                      )}
                    </div>
                  </div>

                  <button
                    onClick={saveSale}
                    disabled={isCartEmpty}
                    className={`w-full py-2 rounded-xl font-black text-md flex items-center justify-center gap-3 transition-all active:scale-95 ${
                      isCartEmpty
                        ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
                    }`}
                  >
                    <CreditCard size={22} />{" "}
                    {saleType === "INVOICE"
                      ? "Generate Invoice"
                      : "Complete Sale"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales History Tab */}
        {activeMainTab === "history" && (
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by customer or product..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-md pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="px-4 pt-2">
              <Tabs
                tabs={statusTabs}
                activeTab={statusFilter}
                onChange={setStatusFilter}
                variant="underlined"
              />
            </div>

            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items Bought</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading ? (
                  <TableRowSkeleton />
                ) : salesList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-zinc-400"
                    >
                      No sales found.
                    </td>
                  </tr>
                ) : (
                  salesList.map((sale) => (
                    <tr
                      key={sale.uuid}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 group transition-colors text-xs"
                    >
                      <td className="px-4 py-3">
                        {sale.customer_name || "Walk-in Customer"}
                      </td>
                      <td
                        className="px-4 py-3 max-w-xs truncate"
                        title={sale.items_summary}
                      >
                        {sale.items_summary.length > 60
                          ? sale.items_summary.slice(0, 60) + "..."
                          : sale.items_summary}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatUGX(sale.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatUGX(sale.amount_paid)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatUGX(sale.total_amount - sale.amount_paid)}
                      </td>
                      <td className="px-4 py-3">
                        {sale.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle size={12} /> COMPLETED
                          </span>
                        ) : sale.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 text-yellow-600">
                            <Clock size={12} /> PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <XCircle size={12} /> CANCELLED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewSale(sale.uuid)}
                            className="p-2 text-zinc-400 hover:text-blue-500"
                          >
                            <Eye size={16} />
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
                    colSpan={8}
                    className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800"
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
        )}

        {/* Sale Details Dialog */}
        <SaleDetailsDialog
          saleUuid={selectedSaleUuid}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPaymentUpdated={handlePaymentUpdated}
        />
      </div>
    </div>
  );
}
