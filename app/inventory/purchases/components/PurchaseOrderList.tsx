// PurchaseOrderList.tsx (unchanged, but included for completeness)
"use client";

import { Plus, Search, Loader2, Edit2, Trash2 } from "lucide-react";

interface PurchaseOrderListProps {
  poList: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  handleCreateNew: () => void;
  startEdit: (uuid: string) => void;
  deletePurchaseOrder: (uuid: string) => void;
  canCreatePurchaseOrder: boolean;
  canUpdatePurchaseOrder: boolean;
  canDeletePurchaseOrder: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  getStatusColor: (status: string) => string;
}

export function PurchaseOrderList({
  poList,
  loading,
  searchTerm,
  setSearchTerm,
  handleCreateNew,
  startEdit,
  deletePurchaseOrder,
  canCreatePurchaseOrder,
  canUpdatePurchaseOrder,
  canDeletePurchaseOrder,
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  setCurrentPage,
  setPageSize,
  getStatusColor,
}: PurchaseOrderListProps) {
  return (
    <>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Purchase Orders
          </h1>
          <p className="text-xs text-zinc-500">
            Manage procurement and supplier relations.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search POs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black w-64 text-zinc-900 dark:text-zinc-100 outline-none"
            />
          </div>
          {canCreatePurchaseOrder && (
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus size={16} /> New Order
            </button>
          )}
        </div>
      </header>

      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
              <th className="px-6 py-4">PO Number</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4">Creation Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2
                    className="animate-spin mx-auto text-zinc-400"
                    size={24}
                  />
                </td>
              </tr>
            ) : poList.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-zinc-400 text-sm"
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              poList.map((po) => (
                <tr
                  key={po.uuid}
                  className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {po.po_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                    {po.vendor_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {po.issue_date}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5  uppercase ${getStatusColor(po.status)}`}
                    >
                      {po.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-zinc-900 dark:text-zinc-100">
                    {new Intl.NumberFormat("en-UG", {
                      style: "currency",
                      currency: "UGX",
                    }).format(po.total_amount || 0)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canUpdatePurchaseOrder && (
                        <button
                          onClick={() => startEdit(po.uuid)}
                          className="p-2 text-zinc-400 hover:text-blue-500"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDeletePurchaseOrder && (
                        <button
                          onClick={() => deletePurchaseOrder(po.uuid)}
                          className="p-2 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-sm bg-zinc-50/30 dark:bg-black">
            <div className="text-zinc-500">
              Showing {poList.length} of {totalCount} orders
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border  bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-zinc-600 dark:text-zinc-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border px-2 py-1 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 outline-none"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        )}
      </div>
    </>
  );
}
