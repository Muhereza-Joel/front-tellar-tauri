"use client";

import {
  Settings2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Type,
  Hash,
  Calendar,
  List,
  X,
} from "lucide-react";
import { useAttributeViewModel } from "./useAttributeViewModel";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export default function AttributeManagementPage() {
  const {
    attributesList,
    editingUuid,
    errors,
    formData,
    optionInput,
    setOptionInput,
    addOption,
    removeOption,
    setFormData,
    handleSave,
    deleteAttribute,
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
  } = useAttributeViewModel();

  const { hasPermission } = useAuth();
  const canCreateAttribute = hasPermission("create_attributes");
  const canUpdateAttribute = hasPermission("edit_attributes");
  const canDeleteAttribute = hasPermission("delete_attributes");

  // Updated for GitHub Black: bg-black, sharp corners (rounded-md), and zinc borders
  const inputStyle = (errorKey: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm outline-none transition-all
    ${
      errors[errorKey]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "number":
        return <Hash size={14} />;
      case "date":
        return <Calendar size={14} />;
      case "select":
        return <List size={14} />;
      default:
        return <Type size={14} />;
    }
  };

  return (
    <div className="px-2 max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {(canCreateAttribute || (editingUuid && canUpdateAttribute)) && (
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
              <header className="mb-6">
                <h1 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                  <Settings2 className="text-blue-500" size={20} />
                  {editingUuid ? "Update Attribute" : "New Attribute"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Define custom product fields.
                </p>
              </header>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Label Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Material"
                    className={inputStyle("label")}
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Field Type
                  </label>
                  <select
                    className={inputStyle("fieldType")}
                    value={formData.fieldType}
                    onChange={(e) =>
                      setFormData({ ...formData, fieldType: e.target.value })
                    }
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Numeric</option>
                    <option value="date">Date Picker</option>
                    <option value="select">Dropdown Select</option>
                  </select>
                </div>

                {formData.fieldType === "select" && (
                  <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-zinc-100 dark:border-zinc-800">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                      Dropdown Options
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add option..."
                        className={inputStyle("options")}
                        value={optionInput}
                        onChange={(e) => setOptionInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addOption())
                        }
                      />
                      <button
                        type="button"
                        onClick={addOption}
                        className="bg-blue-600 text-white px-3 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.options.map((opt, i) => (
                        <span
                          key={i}
                          className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 text-zinc-700 dark:text-zinc-300"
                        >
                          {opt}{" "}
                          <X
                            size={10}
                            className="cursor-pointer text-red-500 hover:text-red-600"
                            onClick={() => removeOption(i)}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 px-1 py-2">
                  <input
                    type="checkbox"
                    id="isRequired"
                    className="rounded-sm border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-transparent"
                    checked={formData.isRequired}
                    onChange={(e) =>
                      setFormData({ ...formData, isRequired: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="isRequired"
                    className="text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  >
                    Mark as Required
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                  >
                    {editingUuid ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingUuid ? "Update" : "Save Definition"}
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

        <section
          className={`
    ${canCreateAttribute || (editingUuid && canUpdateAttribute) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
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
                placeholder="Search attributes..."
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
                  <th className="px-6 py-4">Attribute Label</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Required</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {attributesList.map((attr) => (
                  <tr
                    key={attr.uuid}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {attr.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md w-fit uppercase font-medium">
                        {getTypeIcon(attr.fieldType)} {attr.fieldType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase ${
                          attr.isRequired
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500"
                        }`}
                      >
                        {attr.isRequired ? "YES" : "NO"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {canUpdateAttribute && (
                          <button
                            onClick={() => startEdit(attr)}
                            className="p-2 text-zinc-400 hover:text-blue-500"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}

                        {canDeleteAttribute && (
                          <button
                            onClick={() => deleteAttribute(attr.uuid)}
                            className="p-2 text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
