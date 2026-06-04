"use client";

import React, { useState } from "react";
import { Search, Eye, X, AlertTriangle, Percent } from "lucide-react";
import { useServiceDebtorsViewModel } from "../services/useServiceDebtorsViewModel";
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

/* Interactive Service Order Debt Settlement Modal */
function ServiceDebtCollectionDialog({
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
  const { getSaleDetails, updateHistoricPayment } =
    useServiceDebtorsViewModel();
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

  const grossSubtotal = items.reduce(
    (acc, cur) => acc + (Number(cur.subtotal) || 0),
    0,
  );
  const parsedDiscount = parseFloat(discountAmount) || 0;
  const netTotalBill = Math.max(0, grossSubtotal - parsedDiscount);
  const trailingArrears = Math.max(
    0,
    netTotalBill - (parseFloat(amountPaid) || 0),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 dark:text-white text-amber-600">
            <AlertTriangle size={18} /> Service Debt Collection Desk
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
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Invoice Token
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200">
                    {sale.uuid.slice(0, 8)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Date Issued
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
                    Account Standing
                  </span>
                  <OutstandingDebtBadge
                    debtBalance={
                      Number(sale.total_amount) - Number(sale.amount_paid)
                    }
                  />
                </div>
              </div>

              <div className="border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-[10px] font-black uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">
                        Rendered Service Summary
                      </th>
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
                    <label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                      <Percent size={12} /> Markdown Markdown
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
                      Funds Collected To Date
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
                      Outstanding Deficit
                    </label>
                    <p
                      className={`text-lg font-black mt-1 ${trailingArrears > 0 ? "text-rose-500" : "text-emerald-600"}`}
                    >
                      {trailingArrears > 0
                        ? formatUGX(trailingArrears)
                        : "COMPLETELY PAID"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-bold uppercase text-zinc-500">
                    Net Adjusted Order Total
                  </span>
                  <span className="text-xl font-black dark:text-white">
                    {formatUGX(netTotalBill)}
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
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 text-xs font-bold uppercase transition-all shadow-lg shadow-amber-600/20"
          >
            Post Payments
          </button>
        </div>
      </div>
    </div>
  );
}

/* Master Service Debtors Management Component View */
export default function ServiceDebtorsManagementPage() {
  const vm = useServiceDebtorsViewModel();
  const [selectedSaleUuid, setSelectedSaleUuid] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeDateIndicator, setActiveDateIndicator] = useState<string | null>(
    null,
  );

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

            {/* Data Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50/50 dark:bg-black text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Services Performed</th>
                    <th className="px-6 py-4">Service Date</th>
                    <th className="px-6 py-4 text-right">Invoiced Gross</th>
                    <th className="px-6 py-4 text-right">Discount</th>
                    <th className="px-6 py-4 text-right">
                      Unpaid Arrears Balance
                    </th>
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
                        Clean Sheet: No outstanding service debt structures
                        found matching metrics.
                      </td>
                    </tr>
                  ) : (
                    vm.debtorsList.map((sale) => {
                      const total = Number(sale.total_amount) || 0;
                      const paid = Number(sale.amount_paid) || 0;
                      const discount = Number(sale.discount_amount) || 0;
                      const balance = total - paid;

                      return (
                        <tr
                          key={sale.uuid}
                          className="bg-amber-50/30 hover:bg-amber-100/50 dark:bg-amber-950/10 dark:hover:bg-amber-900/20 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
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
                          <td className="px-6 py-4 text-right font-mono font-bold text-xs text-zinc-500">
                            {formatUGX(total)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-rose-500 font-bold">
                            {discount > 0 ? formatUGX(discount) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-rose-600 font-black">
                            {formatUGX(balance)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedSaleUuid(sale.uuid);
                                setIsDialogOpen(true);
                              }}
                              className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 p-2 rounded-lg transition-all"
                              title="Post Payments"
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

        <ServiceDebtCollectionDialog
          saleUuid={selectedSaleUuid}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPaymentUpdated={vm.refreshServiceDebtors}
        />
      </div>
    </div>
  );
}
