"use client";

import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  Info,
  Link as LinkIcon,
} from "lucide-react";
import { useBrandViewModel } from "./useBrandViewModel";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export default function BrandManagementPage() {
  const {
    brandsList,
    editingUuid,
    errors,
    formData,
    pageSize,
    totalCount,
    updateField,
    handleNameChange,
    handleSave,
    deleteBrand,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useBrandViewModel();

  const { hasPermission } = useAuth();
  const canCreateBrand = hasPermission("create_brands");
  const canUpdateBrand = hasPermission("edit_brands");
  const canDeleteBrand = hasPermission("delete_brands");

  // Updated for GitHub Black: bg-black, sharp corners (rounded-md), and subtle zinc borders
  const inputStyle = (errorKey: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm outline-none transition-all
    ${
      errors[errorKey]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  return (
    <div className="px-2 max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* FORM SECTION */}
        {(canCreateBrand || (editingUuid && canUpdateBrand)) && (
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
              <header className="mb-6">
                <h1 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                  <Tag className="text-blue-500" size={20} />
                  {editingUuid ? "Update Brand" : "New Brand"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Manage your product brand identity.
                </p>
              </header>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apple"
                    className={inputStyle("name")}
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-red-500 mt-1 font-medium">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    URL Slug
                  </label>
                  <div className="relative">
                    <LinkIcon
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      type="text"
                      placeholder="brand-name"
                      className={`${inputStyle("slug")} pl-9`}
                      value={formData.slug}
                      onChange={(e) => updateField("slug", e.target.value)}
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-[10px] text-red-500 mt-1 font-medium">
                      {errors.slug}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className={inputStyle("description")}
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                  {errors.description && (
                    <p className="text-[10px] text-red-500 mt-1 font-medium">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                  >
                    {editingUuid ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingUuid ? "Update" : "Save Brand"}
                  </button>
                  {editingUuid && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        )}

        {/* LIST SECTION */}
        <section
          className={`
    ${canCreateBrand || (editingUuid && canUpdateBrand) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
  `}
        >
          <div className="flex items-center justify-between gap-4 bg-white dark:bg-black p-4 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search brands by name or slug..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-none rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none text-zinc-900 dark:text-zinc-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {brandsList.length > 0 ? (
                  brandsList.map((brand) => (
                    <tr
                      key={brand.uuid}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {brand.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-sm">
                          {brand.slug}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-zinc-500 line-clamp-1">
                          {brand.description || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {canUpdateBrand && (
                            <button
                              onClick={() => startEdit(brand)}
                              className="p-2 text-zinc-400 hover:text-blue-500"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {canDeleteBrand && (
                            <button
                              onClick={() => deleteBrand(brand.uuid)}
                              className="p-2 text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Info
                        className="mx-auto text-zinc-200 dark:text-zinc-800 mb-2"
                        size={24}
                      />
                      <p className="text-zinc-400 text-xs">No brands found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-black">
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
