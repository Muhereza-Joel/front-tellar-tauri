"use client";

import {
  Search,
  Plus,
  FileText,
  Trash2,
  Edit2,
  RotateCcw,
  Car,
  User,
  ShieldAlert,
  Tag,
} from "lucide-react";
import { TableRowSkeleton } from "../../components/Skeletons";
import { Pagination } from "../../components/Pagination";
import { useNotesViewModel } from "./useNotesViewModel";

const CategoryBadge = ({ category }: { category: string }) => {
  const configs = {
    VEHICLE: {
      bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
      icon: <Car size={12} />,
    },
    CUSTOMER: {
      bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
      icon: <User size={12} />,
    },
    SERVICE: {
      bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
      icon: <ShieldAlert size={12} />,
    },
    GENERAL: {
      bg: "bg-zinc-50 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-400",
      icon: <FileText size={12} />,
    },
  }[category] || {
    bg: "bg-zinc-50 text-zinc-700",
    icon: <FileText size={12} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold ${configs.bg}`}
    >
      {configs.icon}
      {category}
    </span>
  );
};

export default function DealershipNotesPage() {
  const vm = useNotesViewModel();

  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-zinc-950 border px-3 py-2 text-sm outline-none transition-all
    ${vm.errors[fieldName] ? "border-rose-500 ring-1 ring-rose-500/20" : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"}
  `;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-2">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Master Column Workspace Splitter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
          {/* LEFT COLUMN: NOTE PAD ENTRY SHEET */}
          <form
            onSubmit={vm.handleSave}
            className="lg:col-span-4 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5"
          >
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-xs font-black uppercase text-zinc-400 flex items-center gap-2 tracking-widest">
                <Plus size={16} />{" "}
                {vm.editingUuid
                  ? "Update Operations Log"
                  : "Draft Operations Note"}
              </h2>
              {vm.editingUuid && (
                <button
                  type="button"
                  onClick={vm.resetForm}
                  className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                  title="Cancel editing"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Subject / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Stock #7829 Trade-in Assessment"
                  value={vm.formData.title}
                  onChange={(e) =>
                    vm.setFormData({ ...vm.formData, title: e.target.value })
                  }
                  className={inputClass("title")}
                />
                {vm.errors.title && (
                  <p className="text-rose-500 text-[11px] font-bold mt-1">
                    {vm.errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Log Category
                  </label>
                  <select
                    value={vm.formData.category}
                    onChange={(e) =>
                      vm.setFormData({
                        ...vm.formData,
                        category: e.target.value as any,
                      })
                    }
                    className={inputClass("category")}
                  >
                    <option value="GENERAL">General Log</option>
                    <option value="VEHICLE">Vehicle / Stock</option>
                    <option value="CUSTOMER">Customer Notes</option>
                    <option value="SERVICE">Operations Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                    Reference ID (VIN/Stock)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., VIN token or stock no."
                    value={vm.formData.referenceId}
                    onChange={(e) =>
                      vm.setFormData({
                        ...vm.formData,
                        referenceId: e.target.value,
                      })
                    }
                    className={inputClass("referenceId")}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Log entry statements description
                </label>
                <textarea
                  rows={5}
                  placeholder="For example, customer feedback, requests, or service interaction details..."
                  value={vm.formData.content}
                  onChange={(e) =>
                    vm.setFormData({ ...vm.formData, content: e.target.value })
                  }
                  className={`${inputClass("content")} resize-none`}
                />
                {vm.errors.content && (
                  <p className="text-rose-500 text-[11px] font-bold mt-1">
                    {vm.errors.content}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={vm.loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white py-3 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-600/10 mt-2"
            >
              {vm.editingUuid ? "Update Log Record" : "Save Log Entry"}
            </button>
          </form>

          {/* RIGHT COLUMN: SEARCHABLE TIMELINE STREAM */}
          <div className="lg:col-span-8 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Realtime Filtering Input Row */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search logs by title context, content summaries, or Reference tags..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                  value={vm.searchTerm}
                  onChange={(e) => vm.setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Note Data Matrix Table Output */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50/50 dark:bg-zinc-950/50 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Subject & Log Context</th>
                    <th className="px-6 py-4">Classification</th>
                    <th className="px-6 py-4">Reference Bind</th>
                    <th className="px-6 py-4">Date Documented</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 dark:text-zinc-300 text-sm">
                  {vm.loading ? (
                    <TableRowSkeleton />
                  ) : vm.notesList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-zinc-400 text-xs italic"
                      >
                        No operations logs matched criteria search scope
                        parameters.
                      </td>
                    </tr>
                  ) : (
                    vm.notesList.map((note) => (
                      <tr
                        key={note.uuid}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/40 transition-colors"
                      >
                        <td className="px-6 py-4 max-w-[280px]">
                          <p className="font-bold text-zinc-900 dark:text-white truncate">
                            {note.title}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 text-justify leading-relaxed">
                            {note.content}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CategoryBadge category={note.category} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                          {note.referenceId ? (
                            <span className="inline-flex items-center gap-1 text-zinc-500">
                              <Tag size={10} /> {note.referenceId}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-400">
                          {note.created_at
                            ? new Date(note.created_at).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => vm.startEdit(note)}
                              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                              title="Modify log data sheet"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Confirm permanent exclusion of this log trail entry?",
                                  )
                                ) {
                                  vm.deleteNote(note.uuid);
                                }
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600"
                              title="Delete model trace entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component Context Segment Row */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
              <Pagination
                currentPage={vm.currentPage}
                totalPages={vm.totalPages}
                pageSize={vm.pageSize}
                totalCount={vm.totalCount}
                onPageChange={vm.setCurrentPage}
                onPageSizeChange={vm.setPageSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
