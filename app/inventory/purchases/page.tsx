"use client";

import {
  Plus,
  Trash2,
  ArrowLeft,
  Edit2,
  Loader2,
  X,
  Search,
} from "lucide-react";
import { usePurchaseOrderViewModel } from "./usePurchaseOrderViewModel";
import { useAuth } from "../../context/AuthContext";

export default function PurchaseOrderPage() {
  const {
    view,
    setView,
    poList,
    formData,
    setFormData,
    items,
    totals,
    editingUuid,
    updateItem,
    addItem,
    removeItem,
    handleCreateNew,
    startEdit,
    deletePurchaseOrder,
    handleSave,
    suppliers,
    loading,
    saving,
    errors,
    productSearch,
    setProductSearch,
    productSuggestions,
    showProductDropdown,
    setShowProductDropdown,
    searchProducts,
    clearProductSearch,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setCurrentPage,
    setPageSize,
    searchTerm,
    setSearchTerm,
  } = usePurchaseOrderViewModel();

  const { hasPermission } = useAuth();
  const canViewPurchaseOrder = hasPermission("view_purchases");
  const canCreatePurchaseOrder = hasPermission("create_purchases");
  const canUpdatePurchaseOrder = hasPermission("edit_purchases");
  const canDeletePurchaseOrder = hasPermission("delete_purchases");

  const inputClass =
    "w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all text-zinc-900 dark:text-zinc-100";

  const errorClass = "border-red-500 ring-1 ring-red-500";

  // --- LIST VIEW ---
  if (view === "list") {
    return (
      <div className="px-2 max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-black font-sans">
        {canViewPurchaseOrder && (
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
                    className="pl-9 pr-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-black w-64"
                  />
                </div>
                {canCreatePurchaseOrder && (
                  <button
                    onClick={handleCreateNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Plus size={16} /> New Order
                  </button>
                )}
              </div>
            </header>

            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
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
                        <td className="px-6 py-4 font-mono font-bold text-sm">
                          {po.po_number}
                        </td>
                        <td className="px-6 py-4 text-sm">{po.vendor_name}</td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {po.issue_date}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase">
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm">
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
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-sm">
                  <div className="text-zinc-500">
                    Showing {poList.length} of {totalCount} orders
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border rounded px-2 py-1"
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
        )}
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="px-2 pt-2 max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-black font-sans select-none">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView("list")}
            className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {editingUuid
                ? `Edit ${formData.po_number}`
                : "New Purchase Order"}
            </h1>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving..." : "Save Order"}
        </button>
      </header>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4 shadow-sm">
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                PO Number *
              </label>
              <input
                type="text"
                className={`${inputClass} font-mono bg-zinc-50 dark:bg-zinc-900 ${errors.poNumber ? errorClass : ""}`}
                value={formData.po_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, po_number: e.target.value })
                }
              />
              {errors.poNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.poNumber}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Supplier *
              </label>
              <select
                className={`${inputClass} ${errors.vendorUuid ? errorClass : ""}`}
                value={formData.vendor_uuid || ""}
                onChange={(e) => {
                  const selectedSupplier = suppliers.find(
                    (s) => s.uuid === e.target.value,
                  );
                  if (selectedSupplier) {
                    setFormData({
                      ...formData,
                      vendor_uuid: selectedSupplier.uuid,
                      vendor_name: selectedSupplier.name,
                    });
                  }
                }}
              >
                <option value="">Select supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.uuid} value={supplier.uuid}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.vendorUuid && (
                <p className="text-xs text-red-500 mt-1">{errors.vendorUuid}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Issue Date *
              </label>
              <input
                type="date"
                className={`${inputClass} ${errors.issueDate ? errorClass : ""}`}
                value={formData.issue_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, issue_date: e.target.value })
                }
              />
              {errors.issueDate && (
                <p className="text-xs text-red-500 mt-1">{errors.issueDate}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Expected Delivery
              </label>
              <input
                type="date"
                className={inputClass}
                value={formData.expected_delivery_date || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expected_delivery_date: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Status
              </label>
              <select
                className={inputClass}
                value={formData.status || ""}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="DRAFT">DRAFT</option>
                <option value="SENT">SENT</option>
                <option value="PARTIALLY_RECEIVED">PARTIALLY RECEIVED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Notes
              </label>
              <textarea
                rows={3}
                className={inputClass}
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Product / SKU *</th>
                  <th className="px-4 py-3 w-20 text-center">Qty *</th>
                  <th className="px-4 py-3 w-28 text-right">Price *</th>
                  <th className="px-4 py-3 w-28 text-right">Total</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((item) => (
                  <tr key={item.uuid}>
                    <td className="px-4 py-2 relative">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search product..."
                          className={`${inputClass} pr-8 ${errors[`items.${item.uuid}.product_name`] ? errorClass : ""}`}
                          value={
                            productSearch[item.uuid!] || item.product_name || ""
                          }
                          onChange={(e) => {
                            const searchTerm = e.target.value;
                            setProductSearch((prev) => ({
                              ...prev,
                              [item.uuid!]: searchTerm,
                            }));
                            searchProducts(searchTerm, item.uuid!);
                            setShowProductDropdown((prev) => ({
                              ...prev,
                              [item.uuid!]: true,
                            }));
                          }}
                          onFocus={() => {
                            if (productSearch[item.uuid!]?.length > 0) {
                              setShowProductDropdown((prev) => ({
                                ...prev,
                                [item.uuid!]: true,
                              }));
                            }
                          }}
                        />
                        {productSearch[item.uuid!] && (
                          <button
                            onClick={() => clearProductSearch(item.uuid!)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                          >
                            <X size={14} />
                          </button>
                        )}
                        {showProductDropdown[item.uuid!] &&
                          productSuggestions[item.uuid!]?.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg max-h-60 overflow-auto">
                              {productSuggestions[item.uuid!].map((product) => (
                                <button
                                  key={product.uuid}
                                  className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm"
                                  onClick={() => {
                                    updateItem(
                                      item.uuid!,
                                      "product_uuid",
                                      product.uuid,
                                    );
                                    updateItem(
                                      item.uuid!,
                                      "product_name",
                                      product.name,
                                    );
                                    updateItem(
                                      item.uuid!,
                                      "sku",
                                      product.sku || "",
                                    );
                                    updateItem(
                                      item.uuid!,
                                      "unit_price",
                                      product.buying_price || 0,
                                    );
                                    setProductSearch((prev) => ({
                                      ...prev,
                                      [item.uuid!]: product.name,
                                    }));
                                    setShowProductDropdown((prev) => ({
                                      ...prev,
                                      [item.uuid!]: false,
                                    }));
                                  }}
                                >
                                  <div className="font-medium">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    SKU: {product.sku} | ${product.buying_price}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className={`${inputClass} text-center`}
                        value={item.quantity || 1}
                        onChange={(e) =>
                          updateItem(
                            item.uuid!,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`${inputClass} text-right`}
                        value={item.unit_price || 0}
                        onChange={(e) =>
                          updateItem(
                            item.uuid!,
                            "unit_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {new Intl.NumberFormat("en-UG", {
                        style: "currency",
                        currency: "UGX",
                      }).format((item.quantity || 0) * (item.unit_price || 0))}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeItem(item.uuid!)}
                        className="text-zinc-400 hover:text-red-500"
                        disabled={items.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.items && (
              <div className="px-4 py-2 text-xs text-red-500">
                {errors.items}
              </div>
            )}
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
              <button
                onClick={addItem}
                className="text-[10px] font-bold text-blue-600 flex items-center gap-1 uppercase tracking-widest hover:text-blue-700 transition-colors"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-3 shadow-sm">
              <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-tighter">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">
                  {new Intl.NumberFormat("en-UG", {
                    style: "currency",
                    currency: "UGX",
                  }).format(totals.subtotal)}
                </span>
              </div>
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-lg font-black text-zinc-900 dark:text-white">
                <span className="uppercase tracking-tighter">Total</span>
                <span className="font-mono">
                  {new Intl.NumberFormat("en-UG", {
                    style: "currency",
                    currency: "UGX",
                  }).format(totals.total)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
