"use client";

import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Search,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { useBranchViewModel } from "./useBranchViewModel";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export default function BranchManagementPage() {
  const {
    branchesList,
    editingUuid,
    errors,
    formData,
    pageSize,
    totalCount,
    setFormData,
    handleSave,
    deleteBranch,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useBranchViewModel();

  const { hasPermission } = useAuth();
  const canCreateBranch = hasPermission("create_branch");
  const canUpdateBranch = hasPermission("edit_branch");
  const canDeleteBranch = hasPermission("delete_branch");

  // Updated for GitHub Black: bg-black, sharp corners (rounded-md), and subtle borders
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
        {(canCreateBranch || (editingUuid && canUpdateBranch)) && (
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <header className="mb-6">
                <h1 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                  <Building2 className="text-blue-500" size={20} />
                  {editingUuid ? "Update Branch" : "Register Branch"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Configure your physical location details.
                </p>
              </header>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Branch Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown Office"
                    className={inputStyle("name")}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
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
                      Email
                    </label>
                    <input
                      type="email"
                      className={inputStyle("email")}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                      Phone
                    </label>
                    <input
                      type="text"
                      className={inputStyle("phone")}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                      Country
                    </label>
                    <input
                      type="text"
                      className={inputStyle("country")}
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                      District / City
                    </label>
                    <input
                      type="text"
                      className={inputStyle("city")}
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    className={inputStyle("address")}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                    Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    className={inputStyle("notes")}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2 py-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className=" border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-transparent"
                      checked={formData.is_main}
                      onChange={(e) =>
                        setFormData({ ...formData, is_main: e.target.checked })
                      }
                    />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 transition-colors">
                      Set as Main Branch (HQ)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className=" border-zinc-300 dark:border-zinc-700 text-green-600 focus:ring-0 bg-transparent"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
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
                    {editingUuid ? "Update" : "Save Branch"}
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

        {/* LIST SECTION */}
        <section
          className={`
    ${canCreateBranch || (editingUuid && canUpdateBranch) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
  `}
        >
          <div className="flex items-center justify-between gap-4 bg-white dark:bg-black p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search branches..."
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
                  <th className="px-6 py-4">Branch Info</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {branchesList.map((branch) => (
                  <tr
                    key={branch.uuid}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {branch.name}
                          </span>
                          {branch.is_main && (
                            <span className="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase">
                              HQ
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span
                            className={`w-2 h-2 rounded-full ${branch.is_active ? "bg-green-500" : "bg-zinc-300"}`}
                          ></span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                            {branch.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-zinc-400" />{" "}
                          {branch.city}
                        </span>
                        <span className="flex items-center gap-1.5 pl-4.5 text-[10px] italic">
                          {branch.country}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5">
                          <Mail size={12} className="text-zinc-400" />{" "}
                          {branch.email || "N/A"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone size={12} className="text-zinc-400" />{" "}
                          {branch.phone || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {canUpdateBranch && (
                          <button
                            onClick={() => startEdit(branch)}
                            className="p-2 text-zinc-400 hover:text-blue-500"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}

                        {canDeleteBranch && (
                          <button
                            onClick={() => deleteBranch(branch.uuid)}
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
