"use client";

import { useState } from "react";
import {
  Package,
  Search,
  Edit2,
  Trash2,
  Box,
  Info,
  DollarSign,
  Tags,
} from "lucide-react";
import { SearchableDropdown } from "@luciodale/react-searchable-dropdown";
import "@luciodale/react-searchable-dropdown/dist/assets/single-style.css";
import { useProductViewModel } from "./useProductViewModel";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export default function ProductManagementPage() {
  const [activeTab, setActiveTab] = useState<"core" | "attributes" | "pricing">(
    "core",
  );
  const {
    productsList,
    categoriesList,
    unitsList,
    attributes,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleNumericChange,
    handleAttributeChange,
    handleSave,
    deleteProduct,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalCount,
  } = useProductViewModel();

  const { hasPermission } = useAuth();
  const canCreateProduct = hasPermission("create_product");
  const canUpdateProduct = hasPermission("edit_product");
  const canDeleteProduct = hasPermission("delete_product");

  const selectedUnit = unitsList.find((u) => u.uuid === formData.uom);
  const unitSingular = selectedUnit?.singular || "unit";
  const unitPlural = selectedUnit?.plural || "units";

  const formatDisplay = (val: number) => {
    if (!val && val !== 0) return "";
    return val.toLocaleString("en-US");
  };

  const inputStyle = (errorKey: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm 
    text-zinc-900 dark:text-zinc-100 outline-none transition-all
    ${
      errors[errorKey]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-300 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  const labelStyle =
    "text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block";

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
        activeTab === id
          ? "bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-blue-400"
          : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div className="px-2 max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {(canCreateProduct || (editingUuid && canUpdateProduct)) && (
          <section className="lg:col-span-4 space-y-6 lg:sticky lg:top-0 self-start">
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
              <header className="mb-6 flex justify-between items-center">
                <h1 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                  <Package className="text-blue-600" size={20} />
                  {editingUuid ? "Update Product" : "New Product"}
                </h1>
                {editingUuid && (
                  <button
                    onClick={resetForm}
                    className="text-[10px] bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-md font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  >
                    CANCEL
                  </button>
                )}
              </header>

              <div className="flex gap-1 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2 overflow-x-auto">
                <TabButton id="core" label="General" icon={Info} />
                <TabButton id="attributes" label="Attributes" icon={Tags} />
                <TabButton id="pricing" label="Pricing" icon={DollarSign} />
              </div>

              <form
                onSubmit={handleSave}
                className="flex flex-col min-h-[400px]"
              >
                <div className="space-y-5 flex-1">
                  {activeTab === "core" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1">
                      <div>
                        <label className={labelStyle}>Product Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Wireless Mouse"
                          className={inputStyle("name")}
                          value={formData.name || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelStyle}>SKU</label>
                          <input
                            type="text"
                            className={inputStyle("sku")}
                            value={formData.sku || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, sku: e.target.value })
                            }
                          />

                          {errors.sku && (
                            <p className="mt-1 text-[10px] font-bold text-red-500 tracking-tight">
                              {errors.sku}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className={labelStyle}>Barcode</label>
                          <input
                            type="text"
                            className={inputStyle("barcode")}
                            value={formData.barcode || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                barcode: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelStyle}>Category</label>
                          <SearchableDropdown
                            options={categoriesList.map((c) => c.name)}
                            value={
                              categoriesList.find(
                                (c) => c.uuid === formData.category_id,
                              )?.name
                            }
                            setValue={(val: string) => {
                              const selected = categoriesList.find(
                                (c) => c.name === val,
                              );
                              setFormData({
                                ...formData,
                                category_id: selected?.uuid || "",
                              });
                            }}
                            placeholder="Search Category"
                            createNewOptionIfNoMatch={false}
                            dropdownOptionNoMatchLabel="No Categories found"
                            dropdownOptionsHeight={320}
                            debounceDelay={100}
                          />
                        </div>
                        <div>
                          <label className={labelStyle}>Unit of Measure</label>
                          <SearchableDropdown
                            options={unitsList.map(
                              (u) => `${u.name} (${u.singular})`,
                            )}
                            value={
                              unitsList.find((u) => u.uuid === formData.uom)
                                ? `${unitsList.find((u) => u.uuid === formData.uom)?.name} (${unitsList.find((u) => u.uuid === formData.uom)?.singular})`
                                : undefined
                            }
                            setValue={(val: string) => {
                              const selected = unitsList.find(
                                (u) => `${u.name} (${u.singular})` === val,
                              );
                              setFormData({
                                ...formData,
                                uom: selected?.uuid || "",
                              });
                            }}
                            placeholder="Search Unit"
                            createNewOptionIfNoMatch={false}
                            dropdownOptionNoMatchLabel="No Units found"
                            dropdownOptionsHeight={320}
                            debounceDelay={100}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                is_active: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-transparent"
                          />
                          <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                            Active
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.has_inventory}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                has_inventory: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-transparent"
                          />
                          <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                            Track Stock
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === "attributes" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1">
                      {attributes.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md">
                          <p className="text-xs text-zinc-400 italic">
                            No dynamic attributes defined.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {attributes.map((attr) => (
                            <div key={attr.uuid}>
                              <label className={labelStyle}>{attr.label}</label>
                              {attr.fieldType === "select" ? (
                                <select
                                  className={inputStyle(
                                    `metadata.${attr.uuid}`,
                                  )}
                                  value={formData.metadata[attr.uuid] || ""}
                                  onChange={(e) =>
                                    handleAttributeChange(
                                      attr.uuid,
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Select...</option>
                                  {attr.options?.map((opt: string) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={
                                    attr.fieldType === "date"
                                      ? "date"
                                      : attr.fieldType === "number"
                                        ? "number"
                                        : "text"
                                  }
                                  className={inputStyle(
                                    `metadata.${attr.uuid}`,
                                  )}
                                  value={formData.metadata[attr.uuid] || ""}
                                  onChange={(e) =>
                                    handleAttributeChange(
                                      attr.uuid,
                                      e.target.value,
                                    )
                                  }
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "pricing" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelStyle}>
                            Buying Price (/{unitSingular})
                          </label>
                          <input
                            type="text"
                            className={inputStyle("buying_price")}
                            value={formatDisplay(formData.buying_price)}
                            onChange={(e) =>
                              handleNumericChange(
                                "buying_price",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className={labelStyle}>
                            Selling Price (/{unitSingular})
                          </label>
                          <input
                            type="text"
                            className={inputStyle("selling_price")}
                            value={formatDisplay(formData.selling_price)}
                            onChange={(e) =>
                              handleNumericChange(
                                "selling_price",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelStyle}>
                            Stock ({unitPlural})
                          </label>
                          <input
                            type="text"
                            className={inputStyle("current_stock")}
                            value={formatDisplay(formData.current_stock)}
                            onChange={(e) =>
                              handleNumericChange(
                                "current_stock",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className={labelStyle}>Min. Level</label>
                          <input
                            type="text"
                            className={inputStyle("minimum_stock_level")}
                            value={formatDisplay(formData.minimum_stock_level)}
                            onChange={(e) =>
                              handleNumericChange(
                                "minimum_stock_level",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-zinc-800 rounded-md space-y-3">
                        <p className="text-[10px] font-black text-zinc-500 uppercase">
                          Taxation
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelStyle}>Rate (%)</label>
                            <input
                              type="text"
                              className={inputStyle("tax_rate")}
                              value={formatDisplay(formData.tax_rate)}
                              onChange={(e) =>
                                handleNumericChange("tax_rate", e.target.value)
                              }
                            />
                          </div>
                          <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.is_tax_inclusive}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    is_tax_inclusive: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded-sm text-blue-600 focus:ring-0 bg-transparent"
                              />
                              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                                Inclusive
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-auto">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md shadow-sm transition-all active:scale-[0.99]"
                  >
                    {editingUuid ? "Update Product" : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section
          className={`
    ${canCreateProduct || (editingUuid && canUpdateProduct) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
  `}
        >
          <div className="sticky top-0 z-10 bg-white dark:bg-black p-4 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-md text-sm outline-none text-zinc-900 dark:text-zinc-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4">Stock & Price</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {productsList.map((product) => {
                    const pUnit = unitsList.find((u) => u.uuid === product.uom);
                    return (
                      <tr
                        key={product.uuid}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-md mt-1 ${product.is_active ? "bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-blue-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}
                            >
                              <Box size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                <span className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1 rounded-sm">
                                  {product.sku}
                                </span>
                                <span>•</span>
                                <span>
                                  {categoriesList.find(
                                    (c) => c.uuid === product.category_id,
                                  )?.name || "Uncategorized"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px]">
                            <p className="font-bold text-zinc-800 dark:text-zinc-200">
                              {product.selling_price.toLocaleString()}
                              <span className="text-[9px] font-normal italic text-zinc-500">
                                {" "}
                                /{pUnit?.singular || "unit"}
                              </span>
                            </p>
                            <p
                              className={`text-[10px] ${product.current_stock <= product.minimum_stock_level ? "text-red-600 font-bold" : "text-zinc-500"}`}
                            >
                              Stock: {product.current_stock}{" "}
                              {pUnit?.plural || "units"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {canUpdateProduct && (
                              <button
                                onClick={() => startEdit(product)}
                                className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}

                            {canDeleteProduct && (
                              <button
                                onClick={() => deleteProduct(product.uuid)}
                                className="p-2 text-zinc-400 hover:text-red-600"
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
              </table>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-black">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
