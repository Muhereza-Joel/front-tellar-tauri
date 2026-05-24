"use client";

import { ArrowLeft, Loader2, Trash2, X } from "lucide-react";

interface PurchaseOrderFormProps {
  editingUuid: string | null;
  formData: any;
  setFormData: (data: any) => void;
  setVendorSelected: (uuid: string) => void;
  items: any[];
  totals: { subtotal: number; total: number };
  saving: boolean;
  errors: any;
  suppliers: any[];
  productSearch: string;
  setProductSearch: (val: string) => void;
  productSuggestions: any[];
  showProductDropdown: boolean;
  setShowProductDropdown: (val: boolean) => void;
  searchProducts: (val: string) => void;
  clearProductSearch: () => void;
  addItem: (product: any) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, key: string, value: any) => void;
  handleSave: (e: any) => void;
  setView: (view: "list" | "form") => void;
  // State permissions from ViewModel
  canEditHeader: boolean;
  canEditItems: boolean;
  canReceiveItems: boolean;
  canEditDeliveryDate: boolean;
  canEditNotes: boolean;
  canManualStatusChange: boolean;
  isLocked: boolean;
}

export function PurchaseOrderForm({
  editingUuid,
  formData,
  setFormData,
  setVendorSelected,
  items,
  totals,
  saving,
  errors,
  suppliers,
  productSearch,
  setProductSearch,
  productSuggestions,
  showProductDropdown,
  setShowProductDropdown,
  searchProducts,
  clearProductSearch,
  addItem,
  removeItem,
  updateItem,
  handleSave,
  setView,
  canEditHeader,
  canEditItems,
  canReceiveItems,
  canEditDeliveryDate,
  canEditNotes,
  canManualStatusChange,
  isLocked,
}: PurchaseOrderFormProps) {
  const inputClass =
    "w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all text-zinc-900 dark:text-zinc-100";
  const errorClass = "border-red-500 ring-1 ring-red-500";

  const getRowBgClass = (item: any) => {
    const received = item.received_quantity || 0;
    const ordered = item.quantity;
    if (received >= ordered) return "bg-green-50 dark:bg-green-950/30";
    if (received > 0) return "bg-amber-50 dark:bg-amber-950/30";
    return "";
  };

  // Show a banner when the order is not in DRAFT but still editable (receiving mode)
  const showReceivingBanner =
    !canEditItems && canReceiveItems && !isLocked && editingUuid;

  return (
    <div className="px-2 pt-2 max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-black font-sans select-none">
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center">
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
          disabled={saving || isLocked}
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

      {showReceivingBanner && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-md text-sm">
          ⚠️ This order is no longer in draft. Only received quantities and
          notes can be updated.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        <section className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4 shadow-sm">
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                PO Number *
              </label>
              <input
                type="text"
                className={`${inputClass} font-mono bg-zinc-50 dark:bg-zinc-900 ${errors.po_number ? errorClass : ""}`}
                value={formData.po_number || ""}
                readOnly
              />
              {errors.po_number && (
                <p className="text-xs text-red-500 mt-1">{errors.po_number}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Supplier *
              </label>
              <select
                className={`${inputClass} ${errors.vendor_uuid ? errorClass : ""}`}
                value={formData.vendor_uuid || ""}
                onChange={(e) => setVendorSelected(e.target.value)}
                disabled={!canEditHeader}
              >
                <option value="">Select a supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.uuid} value={sup.uuid}>
                    {sup.name}
                  </option>
                ))}
              </select>
              {errors.vendor_uuid && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.vendor_uuid}
                </p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Order Date *
              </label>
              <input
                type="date"
                className={`${inputClass} ${errors.issue_date ? errorClass : ""}`}
                value={formData.issue_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, issue_date: e.target.value })
                }
                disabled={!canEditHeader}
              />
              {errors.issue_date && (
                <p className="text-xs text-red-500 mt-1">{errors.issue_date}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Expected Delivery Date
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
                disabled={!canEditDeliveryDate}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Status
              </label>
              <select
                className={inputClass}
                value={formData.status || "DRAFT"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                disabled={!canManualStatusChange}
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="CANCELLED">Cancelled</option>
                Only show these if status is NOT DRAFT, SENT, or CANCELLED
                {!["DRAFT", "SENT", "CANCELLED"].includes(formData.status) && (
                  <>
                    <option value="PARTIALLY_RECEIVED">
                      Partially Received
                    </option>
                    <option value="RECEIVED">Received</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block tracking-wider">
                Notes
              </label>
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                disabled={!canEditNotes}
              />
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-2">
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Order Line Items
            </h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Search products to add item..."
                className={inputClass}
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  searchProducts(e.target.value);
                }}
                onFocus={() => setShowProductDropdown(true)}
                disabled={!canEditItems}
              />
              {productSearch && canEditItems && (
                <button
                  onClick={clearProductSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={16} />
                </button>
              )}

              {showProductDropdown &&
                productSuggestions.length > 0 &&
                canEditItems && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg max-h-60 overflow-y-auto z-50 divide-y divide-zinc-100 dark:divide-zinc-900">
                    {productSuggestions.map((product) => (
                      <div
                        key={product.uuid}
                        onClick={() => {
                          addItem(product);
                          clearProductSearch();
                        }}
                        className="px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-sm text-zinc-800 dark:text-zinc-200"
                      >
                        <div className="font-bold">{product.name}</div>
                        <div className="text-xs text-zinc-500">
                          SKU: {product.sku || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {errors.items && (
              <p className="text-xs text-red-500 font-bold">{errors.items}</p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border divide-y divide-zinc-200 dark:divide-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Product</th>
                    <th className="px-4 py-3 text-center w-20">Ordered</th>
                    <th className="px-4 py-3 text-center w-20">Received</th>
                    <th className="px-4 py-3 text-right w-28">Unit Price</th>
                    <th className="px-4 py-3 text-right w-28">Line Total</th>
                    <th className="px-4 py-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-zinc-400 text-xs"
                      >
                        No items added yet. Search and select items from above.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const received = item.received_quantity || 0;
                      const ordered = item.quantity;
                      const isFullyReceived = received >= ordered;
                      const isPartial = received > 0 && received < ordered;
                      return (
                        <tr
                          key={index}
                          className={`${getRowBgClass(item)} hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              {item.product_name}
                            </div>
                            <div className="text-xs text-zinc-400 font-mono">
                              SKU: {item.sku || "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              className="w-20 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-center font-mono text-zinc-900 dark:text-zinc-100"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              disabled={!canEditItems}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              className={`w-20 bg-white dark:bg-black border rounded px-2 py-1 text-center font-mono ${
                                isFullyReceived
                                  ? "border-green-500 dark:border-green-600 text-green-700 dark:text-green-400"
                                  : isPartial
                                    ? "border-amber-500 dark:border-amber-600 text-amber-700 dark:text-amber-400"
                                    : "border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                              }`}
                              value={item.received_quantity || 0}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "received_quantity",
                                  Number(e.target.value),
                                )
                              }
                              disabled={!canReceiveItems || isLocked}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-28 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-right font-mono text-zinc-900 dark:text-zinc-100"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "unit_price",
                                  Number(e.target.value),
                                )
                              }
                              disabled={!canEditItems}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-900 dark:text-zinc-100">
                            {new Intl.NumberFormat("en-UG", {
                              style: "currency",
                              currency: "UGX",
                            }).format(item.quantity * item.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-zinc-400 hover:text-red-500 p-1"
                              disabled={!canEditItems}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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
