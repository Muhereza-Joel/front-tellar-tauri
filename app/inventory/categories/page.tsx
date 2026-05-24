"use client";

import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Info,
  ChevronRight,
  FolderTree,
} from "lucide-react";
import { SearchableDropdown } from "@luciodale/react-searchable-dropdown";
import "@luciodale/react-searchable-dropdown/dist/assets/single-style.css";
import { useCategoryViewModel } from "./useCategoryViewModel";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export default function CategoryManagementPage() {
  const {
    categoriesList,
    allCategories,
    editingUuid,
    errors,
    formData,
    pageSize,
    totalCount,
    updateField,
    handleSave,
    deleteCategory,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    setCurrentPage,
    setPageSize,
    loading,
  } = useCategoryViewModel();

  const { hasPermission } = useAuth();
  const canCreateCategory = hasPermission("create_category");
  const canUpdateCategory = hasPermission("edit_category");
  const canDeleteCategory = hasPermission("delete_category");

  // Updated for GitHub Black: bg-black, sharp corners (rounded-md), and subtle borders
  const inputStyle = (errorKey: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm outline-none transition-all
    ${
      errors[errorKey]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  /**
   * Recursive helper to build the full breadcrumb path
   */
  const getFullCategoryPath = (categoryId: string | null): string[] => {
    if (!categoryId) return [];
    const category = allCategories.find((c) => c.uuid === categoryId);
    if (!category) return [];

    const parentPath = getFullCategoryPath(category.parent_id);
    return [...parentPath, category.name];
  };

  return (
    <div className="px-2 max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* FORM SECTION */}
        {(canCreateCategory || (editingUuid && canUpdateCategory)) && (
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
              <header className="mb-6">
                <h1 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                  <Layers className="text-blue-500" size={20} />
                  {editingUuid ? "Update Category" : "New Category"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Organize your product hierarchy.
                </p>
              </header>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Category Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Phones"
                    className={inputStyle("name")}
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />

                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500 ml-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Parent Category
                  </label>

                  {(() => {
                    // filter categories (same as before)
                    const filteredCategories = allCategories.filter(
                      (c) => c.uuid !== editingUuid,
                    );

                    // find selected category
                    const selectedCategory = filteredCategories.find(
                      (c) => c.uuid === formData.parent_id,
                    );

                    // helper to build label
                    const getLabel = (
                      cat: (typeof filteredCategories)[number],
                    ) => getFullCategoryPath(cat.uuid).join(" > ");

                    return (
                      <SearchableDropdown
                        options={[
                          "No Parent (Root)",
                          ...filteredCategories.map((cat) => getLabel(cat)),
                        ]}
                        value={
                          formData.parent_id === ""
                            ? "No Parent (Root)"
                            : selectedCategory
                              ? getLabel(selectedCategory)
                              : undefined
                        }
                        setValue={(val: string) => {
                          // 1. Handled Root Parent Selection via updateField
                          if (val === "No Parent (Root)") {
                            updateField("parent_id", "");
                            return;
                          }

                          const selected = filteredCategories.find(
                            (cat) => getLabel(cat) === val,
                          );

                          // 2. Handled Normal Category Selection via updateField
                          updateField("parent_id", selected?.uuid || "");
                        }}
                        placeholder="Select parent category..."
                        createNewOptionIfNoMatch={false}
                        dropdownOptionNoMatchLabel="No categories found"
                        dropdownOptionsHeight={320}
                        debounceDelay={100}
                      />
                    );
                  })()}

                  {/* Render the field-specific error message if it exists */}
                  {errors.parent_id && (
                    <p className="mt-1 text-xs text-red-500 ml-1">
                      {errors.parent_id}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                  >
                    {editingUuid ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingUuid ? "Update" : "Save Category"}
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
    ${canCreateCategory || (editingUuid && canUpdateCategory) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
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
                placeholder="Search categories..."
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
                  <th className="px-6 py-4">Hierarchy</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {categoriesList.length > 0 ? (
                  categoriesList.map((category) => {
                    const fullPath = getFullCategoryPath(category.uuid);
                    return (
                      <tr
                        key={category.uuid}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-md text-zinc-400">
                              <FolderTree size={14} />
                            </div>
                            <div className="flex items-center flex-wrap gap-1 text-xs">
                              {fullPath.map((segment, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1"
                                >
                                  {idx > 0 && (
                                    <ChevronRight
                                      size={12}
                                      className="text-zinc-300 dark:text-zinc-600"
                                    />
                                  )}
                                  <span
                                    className={
                                      idx === fullPath.length - 1
                                        ? "font-bold text-blue-600 dark:text-blue-400"
                                        : "text-zinc-500"
                                    }
                                  >
                                    {segment}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {canUpdateCategory && (
                              <button
                                onClick={() => startEdit(category)}
                                className="p-2 text-zinc-400 hover:text-blue-500"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}

                            {canDeleteCategory && (
                              <button
                                onClick={() => deleteCategory(category.uuid)}
                                className="p-2 text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center">
                      <Info
                        className="mx-auto text-zinc-200 dark:text-zinc-800 mb-2"
                        size={24}
                      />
                      <p className="text-zinc-400 text-xs">
                        No categories found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-black"
                  >
                    {!loading && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                      />
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
