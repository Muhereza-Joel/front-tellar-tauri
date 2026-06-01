"use client";

import { Scale, Search, Plus, Edit2, Trash2, Info, Hash } from "lucide-react";
import { useUnitViewModel } from "./useUnitViewModel";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export default function UnitManagementPage() {
  const {
    unitsList,
    editingUuid,
    errors,
    formData,
    pageSize,
    totalCount,
    updateField,
    handleSave,
    deleteUnit,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useUnitViewModel();

  const { hasPermission } = useAuth();
  const canCreateUnit = hasPermission("create_units");
  const canUpdateUnit = hasPermission("edit_units");
  const canDeleteUnit = hasPermission("delete_units");

  // Updated for GitHub Black: bg-black, sharp corners (rounded-md), and subtle zinc borders
  const inputStyle = (errorKey: string) => `
    w-full bg-white dark:bg-black border px-3 py-2 text-sm outline-none transition-all
    ${
      errors[errorKey]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  return (
    <div className="px-2 max-w-7xl mx-auto min-h-screen bg-slate-100 dark:bg-black font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* FORM SECTION - Left Side */}
        {(canCreateUnit || (editingUuid && canUpdateUnit)) && (
          <section className="lg:col-span-4 space-y-6 lg:sticky lg:top-0 self-start">
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <header className="mb-6">
                <h1 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                  <Scale className="text-blue-500" size={20} />
                  {editingUuid ? "Update Unit" : "Register Unit"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Define measurement units for your products.
                </p>
              </header>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Unit Name (Internal)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weight - Standard"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                      Singular Label
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Piece"
                      className={inputStyle("singular")}
                      value={formData.singular}
                      onChange={(e) => updateField("singular", e.target.value)}
                    />
                    {errors.singular && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">
                        {errors.singular}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                      Plural Label
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Pieces"
                      className={inputStyle("plural")}
                      value={formData.plural}
                      onChange={(e) => updateField("plural", e.target.value)}
                    />
                    {errors.plural && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">
                        {errors.plural}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Optional details..."
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

                <div className="flex flex-col gap-2 py-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className=" border-zinc-300 dark:border-zinc-700 text-green-600 focus:ring-0 bg-transparent"
                      checked={formData.is_active}
                      onChange={(e) =>
                        updateField("is_active", e.target.checked)
                      }
                    />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-green-600 transition-colors">
                      Active Status
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                  >
                    {editingUuid ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingUuid ? "Update" : "Save Unit"}
                  </button>
                  {editingUuid && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        )}

        {/* LIST SECTION - Right Side */}
        <section
          className={`
    ${canCreateUnit || (editingUuid && canUpdateUnit) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
  `}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white dark:bg-black p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search units by name or label..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-none text-sm focus:ring-1 focus:ring-blue-500 outline-none text-zinc-900 dark:text-zinc-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Unit Name</th>
                  <th className="px-6 py-4">Display Labels</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {unitsList.length > 0 ? (
                  unitsList.map((unit) => (
                    <tr
                      key={unit.uuid}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
                            <Hash size={14} />
                          </div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {unit.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-zinc-500 flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="text-zinc-400">Singular:</span>{" "}
                            {unit.singular}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="text-zinc-400">Plural:</span>{" "}
                            {unit.plural}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${unit.is_active ? "bg-green-500" : "bg-zinc-300"}`}
                          ></span>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {unit.is_active ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {canUpdateUnit && (
                            <button
                              onClick={() => startEdit(unit)}
                              className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {canDeleteUnit && (
                            <button
                              onClick={() => deleteUnit(unit.uuid)}
                              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
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
                      <p className="text-zinc-400 text-xs">
                        No units found matching your search.
                      </p>
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
