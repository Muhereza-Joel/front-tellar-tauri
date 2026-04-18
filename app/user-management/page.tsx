"use client";

import {
  Edit2,
  Trash2,
  UserPlus,
  Shield,
  Mail,
  Hash,
  Plus,
  Search,
} from "lucide-react";
import { useUserViewModel } from "./useUserViewModel";
import { FormSkeleton, TableRowSkeleton } from "../components/Skeletons";
import { Pagination } from "../components/Pagination";
import { useAuth } from "../context/AuthContext";

export default function UserManagementPage() {
  const {
    usersList,
    rolesOptions,
    loading,
    editingUuid,
    errors,
    formData,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setPageSize,
    setCurrentPage,
    setFormData,
    handleSave,
    deleteUser,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
  } = useUserViewModel();

  const { hasPermission } = useAuth();

  const canCreateUser = hasPermission("create_user");
  const canUpdateUser = hasPermission("edit_user");
  const canDeleteUser = hasPermission("delete_user");

  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm outline-none transition-all
    ${
      errors[fieldName]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 px-2 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* SIDEBAR FORM */}

        {(canCreateUser || (editingUuid && canUpdateUser)) && (
          <section className="lg:col-span-4 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm h-fit sticky top-6">
            {loading ? (
              <FormSkeleton />
            ) : (
              <div className="space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-2">
                  <UserPlus size={16} />{" "}
                  {editingUuid ? "Update User" : "New User"}
                </h2>

                {errors.form && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                    {errors.form}
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Isaac Newton"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className={inputClass("name")}
                    />
                    {errors.name && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="isaac@moels.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={inputClass("email")}
                      />
                      {errors.email && (
                        <p className="text-[10px] text-red-500 mt-1 font-medium">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                        Age
                      </label>
                      <input
                        type="number"
                        placeholder="25"
                        value={formData.age}
                        onChange={(e) =>
                          setFormData({ ...formData, age: e.target.value })
                        }
                        className={inputClass("age")}
                      />
                      {errors.age && (
                        <p className="text-[10px] text-red-500 mt-1 font-medium">
                          {errors.age}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold mb-1 text-zinc-500 uppercase flex justify-between">
                      <span>Password</span>
                      {editingUuid && (
                        <span className="text-blue-500 normal-case font-medium italic text-[9px]">
                          Optional
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      placeholder={
                        editingUuid
                          ? "•••••••• (Leave blank to keep current)"
                          : "••••••••"
                      }
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={inputClass("password")}
                    />
                    {errors.password && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Role
                    </label>
                    <select
                      value={formData.role_id}
                      onChange={(e) =>
                        setFormData({ ...formData, role_id: e.target.value })
                      }
                      className={inputClass("role_id")}
                    >
                      <option value="">Select...</option>
                      {rolesOptions.map((r) => (
                        <option key={r.uuid} value={r.uuid}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    {errors.role_id && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">
                        {errors.role_id}
                      </p>
                    )}
                  </div>

                  {/* Tenant ID field removed */}

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                    >
                      {editingUuid ? <Edit2 size={18} /> : <Plus size={18} />}
                      {editingUuid ? "Update Record" : "Create User"}
                    </button>

                    {editingUuid && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="w-full text-zinc-500 dark:text-zinc-400 text-xs font-bold py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </section>
        )}

        {/* MAIN TABLE SECTION */}
        <section
          className={`
    ${canCreateUser || (editingUuid && canUpdateUser) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
  `}
        >
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-black">
                  <th colSpan={4} className="px-6 py-4">
                    <div className="relative group">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Filter by name or email..."
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-md pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </th>
                </tr>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User Identity</th>
                  <th className="px-6 py-4">Access Level</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading ? (
                  <TableRowSkeleton />
                ) : usersList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-zinc-400 italic text-xs"
                    >
                      No active users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  usersList.map((user) => {
                    const isCurrentUser =
                      user.uuid ===
                      JSON.parse(localStorage.getItem("pos_session") || "{}")
                        ?.id;
                    return (
                      <tr
                        key={user.uuid}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 group transition-colors text-xs"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-800 dark:text-zinc-100">
                              {user.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Mail size={12} className="text-zinc-500" />{" "}
                              {user.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Shield size={12} /> {user.role_name}
                            </span>
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1 uppercase tracking-tight font-mono">
                              <Hash size={10} /> {user.role_id.substring(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border w-fit ${
                                user.is_active
                                  ? "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                                  : "bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
                              }`}
                            >
                              {user.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                            {user.created_at && (
                              <span className="text-[9px] text-zinc-500">
                                Joined{" "}
                                {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canUpdateUser && (
                              <button
                                onClick={() => startEdit(user)}
                                disabled={isCurrentUser}
                                className={`p-2 transition-colors ${
                                  isCurrentUser
                                    ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                                    : "text-zinc-400 hover:text-blue-500"
                                }`}
                                title={
                                  isCurrentUser
                                    ? "You cannot edit your own account"
                                    : "Edit User"
                                }
                              >
                                <Edit2 size={16} />
                              </button>
                            )}

                            {canDeleteUser && (
                              <button
                                onClick={() => deleteUser(user.uuid)}
                                disabled={isCurrentUser}
                                className={`p-2 transition-colors ${
                                  isCurrentUser
                                    ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                                    : "text-zinc-400 hover:text-red-500"
                                }`}
                                title={
                                  isCurrentUser
                                    ? "You cannot delete your own account"
                                    : "Delete User"
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              <tfoot>
                <tr>
                  <td
                    colSpan={4}
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
