"use client";

import {
  Edit2,
  Trash2,
  Plus,
  Globe,
  Shield,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useRoleViewModel } from "./useRoleViewModel";
import { useAuth } from "../../context/AuthContext";

const RoleFormSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div>
      <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-900 rounded mb-2" />
      <div className="h-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-md" />
    </div>
    <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-md mt-4" />
  </div>
);

const RoleRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-5 w-32 bg-zinc-100 dark:bg-zinc-900 rounded mb-2" />
      <div className="h-3 w-48 bg-zinc-50 dark:bg-zinc-900/50 rounded" />
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-24 bg-zinc-100 dark:bg-zinc-900 rounded-full" />
    </td>
    <td className="px-6 py-4 text-right">
      <div className="h-8 w-8 bg-zinc-50 dark:bg-zinc-900 ml-auto rounded-md" />
    </td>
  </tr>
);

export default function RolesPage() {
  const {
    rolesList,
    loading,
    editingUuid,
    formData,
    setFormData,
    errors,
    setErrors,
    handleSave,
    deleteRole,
    startEdit,
    resetForm,
  } = useRoleViewModel();

  const { hasPermission } = useAuth();
  const canCreateRole = hasPermission("create_role");
  const canUpdateRole = hasPermission("edit_role");
  const canDeleteRole = hasPermission("delete_role");

  const inputStyle = (errorKey: keyof typeof errors) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm outline-none transition-all
    ${
      errors[errorKey]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  return (
    <div className="px-2 max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
        {/* FORM SECTION */}
        {(canCreateRole || (editingUuid && canUpdateRole)) && (
          <section className="lg:col-span-4">
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
              <header className="mb-6">
                <h1 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                  <ShieldCheck className="text-blue-500" size={20} />
                  {editingUuid ? "Update Role" : "New Role"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Define access levels and scoping. Roles are automatically
                  scoped to your organization.
                </p>
              </header>

              {loading && !editingUuid ? (
                <RoleFormSkeleton />
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block">
                      Role Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Administrator"
                      className={inputStyle("name")}
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name)
                          setErrors({ ...errors, name: undefined });
                      }}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : editingUuid ? (
                        <Edit2 size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                      {editingUuid ? "Update Role" : "Save Definition"}
                    </button>
                    {editingUuid && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </section>
        )}

        {/* LIST SECTION */}
        <section
          className={`
    ${canCreateRole || (editingUuid && canUpdateRole) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
  `}
        >
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Role Details</th>
                  <th className="px-6 py-4">Scope</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading && rolesList.length === 0 ? (
                  [1, 2, 3, 4, 5].map((i) => <RoleRowSkeleton key={i} />)
                ) : rolesList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-zinc-400 text-sm italic"
                    >
                      No roles defined yet.
                    </td>
                  </tr>
                ) : (
                  rolesList.map((role) => {
                    const isRootAdmin = role.name === "root_admin";
                    return (
                      <tr
                        key={role.uuid}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {role.name}
                              {isRootAdmin && (
                                <span className="ml-2 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase font-bold">
                                  System
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {role.tenant_id ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-100 dark:border-emerald-800/50 uppercase">
                              <Shield size={10} /> Tenant
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 uppercase">
                              <Globe size={10} /> Global
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {canUpdateRole && (
                              <button
                                onClick={() => startEdit(role)}
                                disabled={isRootAdmin}
                                className={`p-2 transition-colors ${
                                  isRootAdmin
                                    ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                                    : "text-zinc-400 hover:text-blue-500"
                                }`}
                                title={
                                  isRootAdmin
                                    ? "System role cannot be edited"
                                    : "Edit role"
                                }
                              >
                                <Edit2 size={16} />
                              </button>
                            )}

                            {canDeleteRole && (
                              <button
                                onClick={() => deleteRole(role.uuid)}
                                disabled={isRootAdmin}
                                className={`p-2 transition-colors ${
                                  isRootAdmin
                                    ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                                    : "text-zinc-400 hover:text-red-500"
                                }`}
                                title={
                                  isRootAdmin
                                    ? "System role cannot be deleted"
                                    : "Delete role"
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
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
