"use client";

import React, { useState } from "react";
import { Search, Eye, X } from "lucide-react";
import { useServiceSalesViewModel } from "../sale-service/useServiceSalesViewModel";
import { Tabs } from "../../components/Tabs";
import { TableRowSkeleton } from "../../components/Skeletons";
import { Pagination } from "../../components/Pagination";
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

/* Interactive Order Item Context Explorer Modal */
function ServiceSaleDetailsDialog({
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
  const { getSaleDetails, updateHistoricPayment } = useServiceSalesViewModel();
  const [sale, setSale] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = async () => {
    if (!saleUuid) return;
    setLoading(true);
    try {
      const { sale: sData, items: iData } = await getSaleDetails(saleUuid);
      setSale(sData);
      setItems(iData);
      setAmountPaid(String(sData.amount_paid));
      setDiscountAmount(String(sData.discount_amount || 0));
      setError("");
    } catch (err) {
      setError("Failed retrieving transaction pipeline information.");
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
    const newDiscount = parseFloat(discountAmount) || 0;

    // Recalculate original subtotal before discounts
    const originalSubtotal = items.reduce(
      (acc, cur) => acc + (Number(cur.subtotal) || 0),
      0,
    );
    const maxAllowedTotal = Math.max(0, originalSubtotal - newDiscount);

    if (isNaN(newAmount) || newAmount < 0 || newAmount > maxAllowedTotal) {
      setError(
        "The submitted funds figure must reside within 0 and total order value.",
      );
      return;
    }
    try {
      await updateHistoricPayment(saleUuid, newAmount, newDiscount);
      onPaymentUpdated();
      onClose();
    } catch (err) {
      setError("Failed executing payment adjustment update record.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 dark:text-white">
            <Eye size={18} className="text-blue-500" /> Service Ledger Explorer
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
              Retrieving pipeline statement metrics...
            </div>
          ) : sale ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    ID Code
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200">
                    {sale.uuid.slice(0, 8)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Date Created
                  </span>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Assigned Client
                  </span>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                    {sale.customer_name || "Walk-in Profile"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">
                    Workflow State
                  </span>
                  <StatusBadge status={sale.status} />
                </div>
              </div>

              <div className="border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-[10px] font-black uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Service Entity</th>
                      <th className="px-4 py-2 text-right">Units</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:bg-black dark:text-zinc-200">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <p className="font-bold">{item.service_name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {item.variant_name
                              ? `${item.variant_name}`
                              : "Standard Variant Offering"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-xs">
                          {formatUGX(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-zinc-100 dark:bg-zinc-950 p-5 space-y-4 border border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400">
                      Markdown Discount Applied
                    </label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm mt-1 dark:text-white font-bold text-rose-500 outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400">
                      Funds Secured (Paid)
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm mt-1 dark:text-white font-bold text-emerald-600 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="text-right col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">
                      Remaining Balance
                    </label>
                    <p className="text-lg font-bold text-rose-500 mt-1">
                      {formatUGX(
                        Math.max(
                          0,
                          items.reduce(
                            (acc, cur) => acc + (Number(cur.subtotal) || 0),
                            0,
                          ) -
                            (parseFloat(discountAmount) || 0) -
                            (parseFloat(amountPaid) || 0),
                        ),
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-bold uppercase text-zinc-500">
                    Net Total Bill
                  </span>
                  <span className="text-xl font-black dark:text-white">
                    {formatUGX(
                      Math.max(
                        0,
                        items.reduce(
                          (acc, cur) => acc + (Number(cur.subtotal) || 0),
                          0,
                        ) - (parseFloat(discountAmount) || 0),
                      ),
                    )}
                  </span>
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
            Save Adjustment
          </button>
        </div>
      </div>
    </div>
  );
}

/* Master Services Entry Pipeline View Component */
export default function ServicesSalesManagementPage() {
  const vm = useServiceSalesViewModel();
  const [selectedSaleUuid, setSelectedSaleUuid] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeDateIndicator, setActiveDateIndicator] = useState<string | null>(
    null,
  );

  const secondaryStatusTabs = [
    { id: "ALL", label: "All Ledger Logs" },
    { id: "COMPLETED", label: "Settled & Closed" },
    { id: "PENDING", label: "Pending Balances" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-2">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* VIEW: HISTORIC AUDIT STATEMENT LOGS */}
        <div className="space-y-4">
          {/* Filter Ledger Control Bar */}
          {activeDateIndicator && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 px-4 py-2 text-xs font-bold flex items-center gap-2 ">
              <span className="w-1.5 h-1.5 bg-blue-500 animate-pulse" />
              Active Ledger Filters Scope:{" "}
              <span className="underline font-black decoration-dotted">
                {activeDateIndicator}
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
                  placeholder="Search logs by client profiles, service item keys, or token ID data..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                  value={vm.searchTerm}
                  onChange={(e) => vm.setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-auto flex justify-end">
                <DateRangePresetFilter
                  onFilterChange={(dates) => {
                    vm.setDateFrom(dates.from);
                    vm.setDateTo(dates.until);
                  }}
                  onIndicatorChange={setActiveDateIndicator}
                />
              </div>
            </div>

            <div className="px-5 pt-2 border-b border-zinc-50 dark:border-zinc-800">
              <Tabs
                tabs={secondaryStatusTabs}
                activeTab={vm.statusFilter}
                onChange={vm.setStatusFilter}
                variant="underlined"
              />
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50/50 dark:bg-black text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Summary Offerings</th>
                    <th className="px-6 py-4">Booking Date</th>
                    <th className="px-6 py-4 text-right">Total Due</th>
                    <th className="px-6 py-4 text-right">Discount</th>
                    <th className="px-6 py-4 text-right">Balance Due</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:bg-black dark:text-zinc-300 text-sm">
                  {vm.loading ? (
                    <TableRowSkeleton />
                  ) : vm.salesHistoryList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-zinc-400 text-xs italic"
                      >
                        No relevant service ledger logs matched criteria
                        metrics.
                      </td>
                    </tr>
                  ) : (
                    vm.salesHistoryList.map((sale) => {
                      const total = Number(sale.total_amount) || 0;
                      const paid = Number(sale.amount_paid) || 0;
                      const discount = Number(sale.discount_amount) || 0;
                      const balance = total - paid;
                      const hasBalance =
                        balance > 0 && sale.status !== "CANCELLED";

                      return (
                        <tr
                          key={sale.uuid}
                          className={`transition-colors ${
                            hasBalance
                              ? "bg-rose-50/60 hover:bg-rose-100/80 dark:bg-rose-950/10 dark:hover:bg-rose-900/20"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-950/40"
                          }`}
                        >
                          <td className="px-6 py-4 font-bold">
                            {sale.customer_name || "Walk-in Guest Profile"}
                          </td>
                          <td
                            className="px-6 py-4 text-xs text-zinc-500 max-w-[240px] truncate"
                            title={sale.items_summary}
                          >
                            {sale.items_summary}
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-400">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-xs">
                            {formatUGX(total)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-rose-500 font-bold">
                            {discount > 0 ? formatUGX(discount) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-rose-500 font-bold">
                            {hasBalance ? formatUGX(balance) : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={sale.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedSaleUuid(sale.uuid);
                                setIsDialogOpen(true);
                              }}
                              className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 p-2 transition-all"
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

            {/* Pagination Controller Row */}
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

        {/* Audit Statement Inspector Modal Workspace Trigger */}
        <ServiceSaleDetailsDialog
          saleUuid={selectedSaleUuid}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPaymentUpdated={vm.refreshHistory}
        />
      </div>
    </div>
  );
}
