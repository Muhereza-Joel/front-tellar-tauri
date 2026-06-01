"use client";

import {
  Layers,
  Trash2,
  Edit2,
  Search,
  Tag,
  AlertCircle,
  ArrowDown,
  X,
  Package,
} from "lucide-react";
import { SearchableDropdown } from "@luciodale/react-searchable-dropdown";
import "@luciodale/react-searchable-dropdown/dist/assets/single-style.css";
import { useProductVariantViewModel } from "./useProductVariantViewModel";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export default function ProductVariantsPage() {
  const {
    variantsList,
    productsList,
    unitsList,
    editingUuid,
    formData,
    setFormData,
    formErrors,
    handleProductChange,
    handleSave,
    isSaving,
    resetForm,
    startEdit,
    deleteVariant,
    searchTerm,
    setSearchTerm,
    unit,
    currentPage,
    totalPages,
    totalCount,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = useProductVariantViewModel();

  const { hasPermission } = useAuth();
  const canCreateVariant = hasPermission("create_variants");
  const canUpdateVariant = hasPermission("edit_variants");
  const canDeleteVariant = hasPermission("delete_variants");

  // Updated input class for GitHub Black style: bg-black and sharper corners
  const getInputClass = (name: string) => `
    w-full bg-white dark:bg-black border px-3 py-2 text-sm 
    text-zinc-900 dark:text-zinc-100 outline-none transition-all
    ${
      formErrors[name]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  return (
    <div className="px-2 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-2 min-h-screen bg-slate-100 dark:bg-black text-zinc-900 dark:text-zinc-100">
      {(canCreateVariant || (editingUuid && canUpdateVariant)) && (
        <section className="lg:col-span-4">
          <div className="bg-white dark:bg-black p-6 border border-zinc-200 dark:border-zinc-800 sticky top-0 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Layers className="text-blue-600" size={20} />
              {editingUuid ? "Update Variant" : "New Variant"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1 flex justify-between">
                  Base Product
                  {formErrors.product_id && (
                    <AlertCircle size={12} className="text-red-500" />
                  )}
                </label>

                {/* derive selected product once */}
                {(() => {
                  const selectedProduct = productsList.find(
                    (p) => p.uuid === formData.product_id,
                  );

                  return (
                    <SearchableDropdown
                      options={productsList.map((p) => p.name)}
                      value={selectedProduct ? selectedProduct.name : undefined}
                      setValue={(val: string) => {
                        const selected = productsList.find(
                          (p) => p.name === val,
                        );

                        handleProductChange(selected?.uuid || "");
                      }}
                      placeholder="Search product..."
                      createNewOptionIfNoMatch={false}
                      dropdownOptionNoMatchLabel="No products found"
                      dropdownOptionsHeight={320}
                      debounceDelay={100}
                    />
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Type
                  </label>
                  <input
                    className={getInputClass("attribute_type")}
                    placeholder="e.g. Color"
                    value={formData.attribute_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attribute_type: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Value
                  </label>
                  <input
                    className={getInputClass("attribute_value")}
                    placeholder="e.g. Red"
                    value={formData.attribute_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attribute_value: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  SKU
                </label>
                <input
                  className={getInputClass("sku")}
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Price (Ugx / {unit.singular})
                </label>
                <input
                  type="text"
                  className={getInputClass("selling_price")}
                  value={formData.selling_price}
                  onChange={(e) =>
                    setFormData({ ...formData, selling_price: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Stock ({unit.plural})
                  </label>
                  <input
                    type="text"
                    className={getInputClass("current_stock")}
                    value={formData.current_stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_stock: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Min Level
                  </label>
                  <input
                    type="text"
                    className={getInputClass("minimum_stock_level")}
                    value={formData.minimum_stock_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimum_stock_level: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 transition-all disabled:opacity-50 active:scale-[0.99] shadow-sm"
              >
                {isSaving
                  ? "Saving..."
                  : editingUuid
                    ? "Update Variant"
                    : "Create Variant"}
              </button>

              {editingUuid && (
                <button
                  onClick={resetForm}
                  className="w-full flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mt-2 transition-colors"
                >
                  <X size={14} /> Cancel Editing
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* MAIN CONTENT: TABLE */}
      <section
        className={`
    ${canCreateVariant || (editingUuid && canUpdateVariant) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
  `}
      >
        <div className="bg-white dark:bg-black p-4 flex items-center gap-3 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <Search size={18} className="text-zinc-500" />
          <input
            className="bg-transparent outline-none text-sm w-full text-zinc-900 dark:text-zinc-100"
            placeholder="Search variants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Product & SKU
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Price
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Stock Status
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right text-zinc-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {variantsList.map((v) => {
                const parent = productsList.find(
                  (p) => p.uuid === v.product_id,
                );
                const unitRecord = unitsList.find(
                  (u) => u.uuid === parent?.uom,
                );
                const itemUnitSingular =
                  unitRecord?.singular?.toLowerCase() || "unit";
                const itemUnitPlural =
                  unitRecord?.plural?.toLowerCase() || "units";
                const isLow =
                  Number(v.current_stock) <= Number(v.minimum_stock_level);

                return (
                  <tr
                    key={v.uuid}
                    className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Package size={14} className="text-zinc-400" />
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {parent?.name}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                        {v.sku}
                      </p>
                      <div className="text-[10px] text-zinc-500 mt-1 uppercase flex items-center gap-1 font-medium">
                        <Tag size={10} /> {v.attribute_type}:{" "}
                        {v.attribute_value}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600 dark:text-green-500 text-base">
                        ${v.selling_price}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-1 italic">
                        / {itemUnitSingular}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`font-bold flex items-center gap-1 ${isLow ? "text-red-500" : "text-zinc-700 dark:text-zinc-300"}`}
                      >
                        {v.current_stock}{" "}
                        {Number(v.current_stock) === 1
                          ? itemUnitSingular
                          : itemUnitPlural}
                        {isLow && (
                          <ArrowDown size={14} className="animate-bounce" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canUpdateVariant && (
                          <button
                            onClick={() => startEdit(v)}
                            className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}

                        {canDeleteVariant && (
                          <button
                            onClick={() =>
                              confirm("Delete?") && deleteVariant(v.uuid)
                            }
                            className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-black">
              <tr>
                <td colSpan={4} className="px-6 py-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
