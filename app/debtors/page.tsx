"use client";

import React, { useState } from "react";
import { Search, Eye, X, Percent, AlertCircle } from "lucide-react";
import { TableRowSkeleton } from "../components/Skeletons";
import { Pagination } from "../components/Pagination";
import { useDebtorsViewModel } from "./useDebtorsViewModel";
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

function DebtCollectionDialog({
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
  const { getSaleDetails, updateSalePayment } = useDebtorsViewModel();
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
      const { sale: saleData, items: saleItems } =
        await getSaleDetails(saleUuid);
      setSale(saleData);
      setItems(saleItems);
      setAmountPaid(String(saleData.amount_paid));
      setDiscountAmount(String(saleData.discount_amount || 0));
      setError("");
    } catch (err) {
      setError("Failed to load debt ledger transaction parameters");
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
      await updateSalePayment(saleUuid, newAmount, newDiscount);
      onPaymentUpdated();
      onClose();
    } catch (err) {
      setError("Failed to update payment tracking entry");
    }
  };

  if (!isOpen) return null;

  const derivedSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const parsedDiscount = parseFloat(discountAmount) || 0;
  const dynamicallyCalculatedTotal = Math.max(
    0,
    derivedSubtotal - parsedDiscount,
  );
  const ongoingDebtBalance = Math.max(
    0,
    dynamicallyCalculatedTotal - (parseFloat(amountPaid) || 0),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle size={18} /> Debt Collection & Clearance Settlement
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
              Retrieving file dossiers...
            </div>
          ) : sale ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-800">
                <DetailItem label="Ref Invoice" value={sale.uuid.slice(0, 8)} />
                <DetailItem
                  label="Issue Date"
                  value={new Date(sale.created_at).toLocaleDateString()}
                />
                <DetailItem
                  label="Debtor Client"
                  value={sale.customer_name || "Walk-in Account"}
                />
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">
                    Current Standing
                  </span>
                  <ArrearsBadge
                    balance={sale.total_amount - sale.amount_paid}
                  />
                </div>
              </div>

              <div className="border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-[10px] font-black uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">
                        Product Detail Summary
                      </th>
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
                  <span>Gross Valuation Valuation</span>
                  <span>{formatUGX(derivedSubtotal)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-black uppercase text-zinc-600 dark:text-zinc-400">
                    Adjusted Total Bill
                  </span>
                  <span className="text-xl font-black dark:text-white">
                    {formatUGX(dynamicallyCalculatedTotal)}
                  </span>
                </div>

                <hr className="border-dashed border-zinc-200 dark:border-zinc-800 my-2" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                      <Percent size={12} className="text-zinc-500" /> Adjust
                      Discount
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
                      Collected Realized Amount
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm mt-1 dark:text-white font-medium outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">
                      Remaining Deficit Balance
                    </label>
                    <p
                      className={`text-lg font-black mt-1 ${ongoingDebtBalance > 0 ? "text-rose-500" : "text-emerald-500"}`}
                    >
                      {ongoingDebtBalance > 0
                        ? formatUGX(ongoingDebtBalance)
                        : "FULLY SETTLED"}
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
            Close Panel
          </button>
          <button
            onClick={handleUpdatePayment}
            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 text-xs font-bold uppercase transition-all shadow-lg shadow-rose-600/20"
          >
            Post Payments
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

export default function DebtorsPage() {
  const vm = useDebtorsViewModel();
  const [selectedSaleUuid, setSelectedSaleUuid] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState<string | null>(null);

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
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 px-4 py-2 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <span className="w-1.5 h-1.5 bg-rose-500 animate-pulse" />
            Active Collection Windows:{" "}
            <span className="underline font-black">{activeIndicator}</span>
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
                placeholder="Search outstanding debtors, client names, or descriptions..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 dark:text-white transition-all"
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

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50/50 dark:bg-black text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Purchase Items Summary</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Discount</th>
                  <th className="px-6 py-4 text-right">Total Invoiced</th>
                  <th className="px-6 py-4 text-right">Unpaid Arrears</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 dark:bg-black dark:text-zinc-300">
                {vm.loading ? (
                  <TableRowSkeleton />
                ) : vm.debtorsList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-zinc-400 text-xs italic"
                    >
                      Clean Sheet: No outstanding customer deficits match the
                      query criteria.
                    </td>
                  </tr>
                ) : (
                  vm.debtorsList.map((sale) => {
                    const balance = sale.total_amount - sale.amount_paid;
                    return (
                      <tr
                        key={sale.uuid}
                        className="transition-colors bg-rose-50/30 hover:bg-rose-100/50 dark:bg-rose-950/10 dark:hover:bg-rose-900/20"
                      >
                        <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {sale.customer_name || "Unregistered Account"}
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
                        <td className="px-6 py-4 text-right font-mono text-xs text-zinc-400">
                          {sale.discount_amount > 0
                            ? formatUGX(sale.discount_amount)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-xs text-zinc-600 dark:text-zinc-400">
                          {formatUGX(sale.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-rose-600 font-black">
                          {formatUGX(balance)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewDetails(sale.uuid)}
                            className="bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 p-2 rounded-lg transition-all"
                            title="Collect Payments"
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

        <DebtCollectionDialog
          saleUuid={selectedSaleUuid}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPaymentUpdated={vm.refreshDebtors}
        />
      </div>
    </div>
  );
}
