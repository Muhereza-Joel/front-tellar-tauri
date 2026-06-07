"use client";

import React, { useState } from "react";
import { Search, Eye, X, AlertCircle } from "lucide-react";
import { TableRowSkeleton } from "../components/Skeletons";
import { Pagination } from "../components/Pagination";
import { useDebtorsViewModel, CustomerDebtGroup } from "./useDebtorsViewModel";
import { DateRangePresetFilter } from "../components/DateRangePresetFilter";

const formatUGX = (amount: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ArrearsBadge = ({ balance }: { balance: number }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-black border bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 uppercase tracking-wider">
      <AlertCircle size={10} /> {formatUGX(balance)} Due
    </span>
  );
};

// ------------------------------------------------------------------
// NEW: Multi‑sale collection dialog for a customer
// ------------------------------------------------------------------
function CustomerCollectionDialog({
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
  const { getUnpaidSalesForCustomer, updateSalePayment } =
    useDebtorsViewModel();
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
      setError("Failed to load customer debt details");
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
      await updateSalePayment(saleUuid, newAmountPaid, newDiscount);
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
    (sum, s) => sum + (s.total_amount - s.amount_paid),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 shadow-2xl w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle size={18} /> Debt Collection – {customerName}
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
              Loading outstanding invoices...
            </div>
          ) : unpaidSales.length === 0 ? (
            <div className="text-center py-10 text-emerald-600 font-bold">
              No pending debts for this customer.
            </div>
          ) : (
            <>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-zinc-500">
                  Total Outstanding
                </span>
                <span className="text-2xl font-black text-rose-600">
                  {formatUGX(totalDue)}
                </span>
              </div>

              {unpaidSales.map((sale) => {
                const balance = sale.total_amount - sale.amount_paid;
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
                      <ArrearsBadge balance={balance} />
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
                    <SalePaymentUpdater
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

// Helper component for inline payment editing per sale
function SalePaymentUpdater({
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
            className="bg-rose-600 hover:bg-rose-700 disabled:bg-zinc-400 text-white px-4 py-2 text-xs font-bold uppercase w-full"
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
// Main Page Component (grouped by customer)
// ------------------------------------------------------------------
export default function DebtorsPage() {
  const vm = useDebtorsViewModel();
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string | null;
    name: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCollect = (group: CustomerDebtGroup) => {
    setSelectedCustomer({
      id: group.customer_id,
      name: group.customer_name,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black px-2">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search customers or items..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-rose-500/20"
                value={vm.searchTerm}
                onChange={(e) => vm.setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <DateRangePresetFilter
                onFilterChange={(dates) => {
                  vm.setDateFrom(dates.from);
                  vm.setDateTo(dates.until);
                }}
                onIndicatorChange={() => {}}
              />
            </div>
          </div>

          {/* Grouped Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 dark:bg-black text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Unpaid Invoices</th>
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
                      No outstanding debts match the criteria.
                    </td>
                  </tr>
                ) : (
                  vm.debtorsGroups.map((group) => (
                    <tr
                      key={group.customer_id}
                      className="hover:bg-rose-50/30 dark:hover:bg-rose-950/10"
                    >
                      <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {group.customer_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                        {group.sales.length} invoice(s)
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-rose-600">
                        {formatUGX(group.total_due)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleCollect(group)}
                          className="bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 p-2 rounded-lg transition-all"
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

        <CustomerCollectionDialog
          customerId={selectedCustomer?.id ?? null}
          customerName={selectedCustomer?.name ?? ""}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPaymentUpdated={vm.refreshDebtors}
        />
      </div>
    </div>
  );
}
