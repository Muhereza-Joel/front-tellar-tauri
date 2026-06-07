"use client";

import React, { useState } from "react";
import { Search, Eye, X, AlertTriangle } from "lucide-react";
import {
  useServiceDebtorsViewModel,
  ServiceCustomerDebtGroup,
} from "./useServiceDebtorsViewModel";
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

const OutstandingDebtBadge = ({ debtBalance }: { debtBalance: number }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-black border bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 uppercase tracking-wider">
      <AlertTriangle size={11} /> {formatUGX(debtBalance)} Arrears
    </span>
  );
};

// ------------------------------------------------------------------
// NEW: Multi‑sale collection dialog for a customer (service version)
// ------------------------------------------------------------------
function ServiceCustomerCollectionDialog({
  customerId,
  customerName,
  isOpen,
  onClose,
  onPaymentUpdated,
}: {
  customerId: string | null;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated: () => void;
}) {
  const { getUnpaidSalesForCustomer, updateHistoricPayment } =
    useServiceDebtorsViewModel();
  const [unpaidSales, setUnpaidSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingUuid, setUpdatingUuid] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchUnpaidSales = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const sales = await getUnpaidSalesForCustomer(customerId);
      setUnpaidSales(sales);
      setError("");
    } catch (err) {
      setError("Failed to load customer service debt details");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) fetchUnpaidSales();
  }, [isOpen, customerId]);

  const handleUpdatePayment = async (
    saleUuid: string,
    newAmountPaid: number,
    newDiscount: number,
  ) => {
    setUpdatingUuid(saleUuid);
    try {
      await updateHistoricPayment(saleUuid, newAmountPaid, newDiscount);
      await fetchUnpaidSales(); // refresh list after update
      onPaymentUpdated(); // refresh main table
    } catch (err) {
      setError("Payment update failed");
    } finally {
      setUpdatingUuid(null);
    }
  };

  if (!isOpen) return null;

  const totalDue = unpaidSales.reduce(
    (sum, s) => sum + ((s.total_amount || 0) - (s.amount_paid || 0)),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 shadow-2xl w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} /> Service Debt Collection – {customerName}
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
              Loading outstanding service invoices...
            </div>
          ) : unpaidSales.length === 0 ? (
            <div className="text-center py-10 text-emerald-600 font-bold">
              No pending service debts for this customer.
            </div>
          ) : (
            <>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-zinc-500">
                  Total Outstanding
                </span>
                <span className="text-2xl font-black text-amber-600">
                  {formatUGX(totalDue)}
                </span>
              </div>

              {unpaidSales.map((sale) => {
                const balance =
                  (sale.total_amount || 0) - (sale.amount_paid || 0);
                return (
                  <div
                    key={sale.uuid}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-zinc-400">
                          Invoice #{sale.uuid.slice(0, 8)}
                        </p>
                        <p className="text-sm font-bold mt-1">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <OutstandingDebtBadge debtBalance={balance} />
                    </div>

                    <div className="text-sm text-zinc-600 dark:text-zinc-300">
                      {sale.items_summary}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-zinc-400">
                          Total Bill
                        </label>
                        <p className="font-mono font-bold">
                          {formatUGX(sale.total_amount)}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-zinc-400">
                          Already Paid
                        </label>
                        <p className="font-mono">
                          {formatUGX(sale.amount_paid)}
                        </p>
                      </div>
                    </div>

                    {/* Inline payment updater for this sale */}
                    <ServiceSalePaymentUpdater
                      saleUuid={sale.uuid}
                      currentPaid={sale.amount_paid}
                      currentDiscount={sale.discount_amount}
                      total={sale.total_amount}
                      isUpdating={updatingUuid === sale.uuid}
                      onUpdate={handleUpdatePayment}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase dark:text-zinc-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for inline payment editing per service sale
function ServiceSalePaymentUpdater({
  saleUuid,
  currentPaid,
  currentDiscount,
  total,
  isUpdating,
  onUpdate,
}: {
  saleUuid: string;
  currentPaid: number;
  currentDiscount: number;
  total: number;
  isUpdating: boolean;
  onUpdate: (uuid: string, newPaid: number, newDiscount: number) => void;
}) {
  const [amountPaid, setAmountPaid] = useState(String(currentPaid));
  const [discountAmount, setDiscountAmount] = useState(String(currentDiscount));
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const newPaid = parseFloat(amountPaid);
    const newDiscount = parseFloat(discountAmount);
    const derivedSubtotal = total + currentDiscount; // original subtotal before discount
    if (
      isNaN(newDiscount) ||
      newDiscount < 0 ||
      newDiscount > derivedSubtotal
    ) {
      setError("Invalid discount amount");
      return;
    }
    const newTotal = Math.max(0, derivedSubtotal - newDiscount);
    if (isNaN(newPaid) || newPaid < 0 || newPaid > newTotal) {
      setError("Payment amount exceeds total bill");
      return;
    }
    setError("");
    onUpdate(saleUuid, newPaid, newDiscount);
  };

  return (
    <div className="pt-2 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase text-zinc-400">
            Discount
          </label>
          <input
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-zinc-400">
            Payment Received
          </label>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-400 text-white px-4 py-2 text-xs font-bold uppercase w-full"
          >
            {isUpdating ? "Updating..." : "Apply"}
          </button>
        </div>
      </div>
      {error && <p className="text-rose-500 text-[11px]">{error}</p>}
    </div>
  );
}

// ------------------------------------------------------------------
// Main Page Component (grouped by customer for service debts)
// ------------------------------------------------------------------
export default function ServiceDebtorsManagementPage() {
  const vm = useServiceDebtorsViewModel();
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string | null;
    name: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeDateIndicator, setActiveDateIndicator] = useState<string | null>(
    null,
  );

  const handleCollect = (group: ServiceCustomerDebtGroup) => {
    setSelectedCustomer({
      id: group.customer_id,
      name: group.customer_name,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-2">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          {activeDateIndicator && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 px-4 py-2 text-xs font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
              Active Debt Collection Scope:{" "}
              <span className="underline font-black">
                {activeDateIndicator}
              </span>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Search and date filter */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Filter unsettled services by client profile, service descriptors, keys..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white transition-all"
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

            {/* Grouped Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50/50 dark:bg-black text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Unpaid Service Invoices</th>
                    <th className="px-6 py-4 text-right">
                      Total Amount Demanded
                    </th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 dark:bg-black dark:text-zinc-300">
                  {vm.loading ? (
                    <TableRowSkeleton />
                  ) : vm.debtorsGroups.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-zinc-400 text-xs italic"
                      >
                        Clean Sheet: No outstanding service debt structures
                        found matching metrics.
                      </td>
                    </tr>
                  ) : (
                    vm.debtorsGroups.map((group) => (
                      <tr
                        key={group.customer_id}
                        className="bg-amber-50/30 hover:bg-amber-100/50 dark:bg-amber-950/10 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {group.customer_name}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                          {group.sales.length} invoice(s)
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-black text-amber-600">
                          {formatUGX(group.total_due)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleCollect(group)}
                            className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 p-2 rounded-lg transition-all"
                            title="Collect Payments"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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

        <ServiceCustomerCollectionDialog
          customerId={selectedCustomer?.id ?? null}
          customerName={selectedCustomer?.name ?? ""}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPaymentUpdated={vm.refreshServiceDebtors}
        />
      </div>
    </div>
  );
}
