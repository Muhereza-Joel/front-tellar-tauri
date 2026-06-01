"use client";

import { useState } from "react";
import {
  Box,
  DollarSign,
  AlertTriangle,
  Tag,
  Search,
  Package,
  Layers,
} from "lucide-react";
import { useInventoryViewModel } from "./useInventoryViewModel";
import { Pagination } from "../components/Pagination";

export default function InventoryPage() {
  const [activeMode, setActiveMode] = useState<"products" | "variants">(
    "products",
  );
  const {
    items,
    loading,
    searchTerm,
    setCurrentPage,
    setSearchTerm,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    totalCount,
    stats,
  } = useInventoryViewModel(activeMode);

  return (
    <div className="space-y-6 px-2 max-w-7xl mx-auto min-h-screen bg-slate-100 dark:bg-black">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total SKUs"
          value={stats.totalSkus.toLocaleString()}
          sub="Active items"
          icon={<Box className="text-blue-500" />}
        />
        <StatCard
          title="Inventory Value"
          value={`UGX ${stats.totalValue.toLocaleString()}`}
          sub="Selling price × stock"
          icon={<DollarSign className="text-emerald-500" />}
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockCount.toLocaleString()}
          sub="Requires attention"
          icon={<AlertTriangle className="text-amber-500" />}
          color="text-amber-600"
        />
        <StatCard
          title="View Mode"
          value={activeMode === "products" ? "Products" : "Variants"}
          sub="Current preset"
          icon={<Tag className="text-purple-500" />}
        />
      </div>

      {/* Mode Toggle & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-black p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveMode("products")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all ${
              activeMode === "products"
                ? "bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-blue-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            <Package size={14} /> Products
          </button>
          <button
            onClick={() => setActiveMode("variants")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all ${
              activeMode === "variants"
                ? "bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-blue-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            <Layers size={14} /> Variants
          </button>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={16}
          />
          <input
            type="text"
            placeholder={`Search ${activeMode}...`}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-sm outline-none text-zinc-900 dark:text-zinc-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock Available</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No items match your search.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.uuid}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800">
                          {activeMode === "products" ? (
                            <Package size={16} className="text-blue-600" />
                          ) : (
                            <Layers size={16} className="text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                            <span className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1">
                              {item.sku}
                            </span>
                            {activeMode === "products" &&
                              item.category_name && (
                                <>
                                  <span>•</span>
                                  <span>{item.category_name}</span>
                                </>
                              )}
                            {activeMode === "variants" &&
                              item.attribute_type && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {item.attribute_type}:{" "}
                                    {item.attribute_value}
                                  </span>
                                </>
                              )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.category_name ? (
                        <span>{item.category_name}</span>
                      ) : (
                        <span>----</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`text-sm font-bold ${
                          item.current_stock != null && item.minimum_stock_level != null && item.current_stock <= item.minimum_stock_level
                            ? "text-red-600"
                            : "text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {item.current_stock} {item.unit_plural}
                      </div>
                      {item.current_stock != null && item.minimum_stock_level != null && item.current_stock <= item.minimum_stock_level && (
                        <div className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                          <AlertTriangle size={10} /> Low stock
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-600 dark:text-emerald-500">
                        UGX {item.selling_price != null ? item.selling_price.toLocaleString() : "N/A"}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-1">
                        / {item.unit_singular}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
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
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  color = "text-zinc-900 dark:text-zinc-50",
}: any) {
  return (
    <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {title}
        </p>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wide font-medium">
        {sub}
      </p>
    </div>
  );
}
