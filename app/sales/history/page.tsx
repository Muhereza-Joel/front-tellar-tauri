"use client";

import React, { useState } from "react";
import { Search, Eye, X, Percent } from "lucide-react";
import { Tabs } from "../../components/Tabs";
import { TableRowSkeleton } from "../../components/Skeletons";
import { Pagination } from "../../components/Pagination";
import { useSalesViewModel } from "../../sales/useSalesViewModel";
import { DateRangePresetFilter } from "../../components/DateRangePresetFilter";

const formatUGX = (amount: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles =
    {
      COMPLETED:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
      PENDING:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
      CANCELLED:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
    }[status] || "bg-zinc-100 text-zinc-700";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold border ${styles}`}
    >
      {status}
    </span>
  );
};

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
  const [discountAmount, setDiscountAmount] = useState<string>(""); // <-- Added state variable for inline edit
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
      setDiscountAmount(String(saleData.discount_amount || 0)); // <-- Populate initial discount
      setError("");
    } catch (err) {
      setError("Failed to load sale details");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && saleUuid) fetchDetails();
  }, [isOpen, saleUuid]);

  const handleUpdatePayment = async () => {
    if (!saleUuid) return;
    const newAmount = parseFloat(amountPaid);
    const newDiscount = parseFloat(discountAmount);

    const derivedSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    if (
      isNaN(newDiscount) ||
      newDiscount < 0 ||
      newDiscount > derivedSubtotal
    ) {
      setError("Discount cannot be negative or exceed order subtotal amount");
      return;
    }

    const targetTotalBill = Math.max(0, derivedSubtotal - newDiscount);

    if (isNaN(newAmount) || newAmount < 0 || newAmount > targetTotalBill) {
      setError(
        "Please check the payment amount entered. It cannot exceed total bill",
      );
      return;
    }

    try {
      await updateSalePayment(saleUuid, newAmount, newDiscount); // <-- Updated viewmodel dispatch trigger
      onPaymentUpdated();
      onClose();
    } catch (err) {
      setError("Failed to update payment details");
    }
  };

  if (!isOpen) return null;

  const derivedSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const parsedDiscount = parseFloat(discountAmount) || 0;
  const dynamicallyCalculatedTotal = Math.max(
    0,
    derivedSubtotal - parsedDiscount,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 dark:text-white">
            <Eye size={18} className="text-blue-500" /> Transaction View & Edit
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
          {loading ? (
            <div className="text-center py-10 text-zinc-500 italic">
              Retrieving transaction details...
            </div>
          ) : sale ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-800">
                <DetailItem label="ID" value={sale.uuid.slice(0, 8)} />
                <DetailItem
                  label="Date"
                  value={new Date(sale.created_at).toLocaleDateString()}
                />
                <DetailItem
                  label="Customer"
                  value={sale.customer_name || "Walk-in"}
                />
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">
                    Status
                  </span>
                  <StatusBadge status={sale.status} />
                </div>
              </div>

              <div className="border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-[10px] font-black uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 dark:text-zinc-200">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <p className="font-bold">{item.product_name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {item.variant_label}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatUGX(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-zinc-100 dark:bg-zinc-950 p-5 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase">
                  <span>Cart Subtotal</span>
                  <span>{formatUGX(derivedSubtotal)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-black uppercase text-zinc-600 dark:text-zinc-400">
                    Adjusted Grand Total
                  </span>
                  <span className="text-xl font-black dark:text-white">
                    {formatUGX(dynamicallyCalculatedTotal)}
                  </span>
                </div>

                <hr className="border-dashed border-zinc-200 dark:border-zinc-800 my-2" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                      <Percent size={12} className="text-zinc-500" /> Discount
                      Amount
                    </label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm mt-1 dark:text-white font-medium outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm mt-1 dark:text-white font-medium outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">
                      Arrears Balance
                    </label>
                    <p className="text-lg font-bold text-rose-500 mt-1">
                      {formatUGX(
                        Math.max(
                          0,
                          dynamicallyCalculatedTotal -
                            (parseFloat(amountPaid) || 0),
                        ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase dark:text-zinc-400"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdatePayment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-xs font-bold uppercase transition-all shadow-lg shadow-blue-600/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
      {label}
    </span>
    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
      {value}
    </span>
  </div>
);

export default function SalesHistoryPage() {
  const vm = useSalesViewModel();
  const [selectedSaleUuid, setSelectedSaleUuid] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState<string | null>(null);

  const statusTabs = [
    { id: "ALL", label: "All" },
    { id: "COMPLETED", label: "Completed" },
    { id: "PENDING", label: "Pending" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  const handleViewDetails = (uuid: string) => {
    setSelectedSaleUuid(uuid);
    setIsDialogOpen(true);
  };

  const handleDateFilterEngineChange = (dates: {
    from: string;
    until: string;
  }) => {
    vm.setDateFrom(dates.from);
    vm.setDateTo(dates.until);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black px-2">
      <div className="max-w-7xl mx-auto space-y-4">
        {activeIndicator && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 px-4 py-2 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <span className="w-1.5 h-1.5 bg-blue-500 animate-pulse" />
            Active Filter Ledger Scope:{" "}
            <span className="underline decoration-dotted underline-offset-2 font-black">
              {activeIndicator}
            </span>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search ledger by client, products, or metadata summary..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-auto flex justify-end">
              <DateRangePresetFilter
                onFilterChange={handleDateFilterEngineChange}
                onIndicatorChange={setActiveIndicator}
              />
            </div>
          </div>

          <div className="px-5 pt-2 border-b border-zinc-50 dark:border-zinc-800">
            <Tabs
              tabs={statusTabs}
              activeTab={vm.statusFilter}
              onChange={vm.setStatusFilter}
              variant="underlined"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 dark:bg-black text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Summary</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Discount</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:bg-black dark:text-zinc-300">
                {vm.loading ? (
                  <TableRowSkeleton />
                ) : vm.salesList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-zinc-400 text-xs italic"
                    >
                      No matching transaction ledger logs identified for current
                      parameters
                    </td>
                  </tr>
                ) : (
                  vm.salesList.map((sale) => {
                    const hasBalance = sale.total_amount - sale.amount_paid > 0;
                    return (
                      <tr
                        key={sale.uuid}
                        className={`transition-colors group ${
                          hasBalance
                            ? "bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:border-zinc-700"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-950/50 dark:border-zinc-700"
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-sm">
                          {sale.customer_name || "Walk-in Customer"}
                        </td>
                        <td
                          className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[220px]"
                          title={sale.items_summary}
                        >
                          {sale.items_summary}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </td>
                        {/* New layout column row displaying the record value */}
                        <td className="px-6 py-4 text-right font-mono font-bold text-xs text-rose-500">
                          {sale.discount_amount > 0
                            ? formatUGX(sale.discount_amount)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-xs">
                          {formatUGX(sale.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-rose-500 font-bold">
                          {hasBalance
                            ? formatUGX(sale.total_amount - sale.amount_paid)
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={sale.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewDetails(sale.uuid)}
                            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 p-2 rounded-lg transition-all"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

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

        <SaleDetailsDialog
          saleUuid={selectedSaleUuid}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPaymentUpdated={vm.refreshSales}
        />
      </div>
    </div>
  );
}
