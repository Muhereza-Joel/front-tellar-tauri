"use client";

import {
  Shield,
  Lock,
  Search,
  Save,
  ChevronRight,
  Check,
  UserCircle,
  Loader2,
  CheckSquare,
} from "lucide-react";
import { usePermissionViewModel } from "./usePermissionViewModel";
import { useAuth } from "../../context/AuthContext";

const RoleListSkeleton = () => (
  <div className="p-2 space-y-2 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-900 w-full" />
    ))}
  </div>
);

const ResourceCardSkeleton = () => (
  <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-pulse">
    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 flex justify-between">
      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 w-24" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 w-16" />
    </div>
    <div className="p-4 grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-8 bg-zinc-50 dark:bg-zinc-900/50 " />
      ))}
    </div>
  </div>
);

export default function PermissionManagementPage() {
  const {
    roles,
    resources,
    selectedRoleId,
    setSelectedRoleId,
    assignedPermissions,
    togglePermission,
    selectAllForResource,
    searchTerm,
    setSearchTerm,
    loading,
    handleSave,
    isRootAdmin,
  } = usePermissionViewModel();

  const { hasPermission } = useAuth();
  const canCreatePermission = hasPermission("create_permission");
  const canUpdatePermission = hasPermission("edit_permission");

  const filteredResources = resources.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black text-zinc-900 dark:text-zinc-100 px-2 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* SIDEBAR */}

        {canCreatePermission && (
          <aside className="lg:col-span-3">
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800  shadow-sm overflow-hidden sticky top-0">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <UserCircle size={14} className="text-blue-500" /> Available
                  Roles
                </h2>
              </div>

              {loading && roles.length === 0 ? (
                <RoleListSkeleton />
              ) : (
                <div className="p-2 space-y-1">
                  {roles.map((role) => {
                    const isRoot = role.name === "root_admin";
                    return (
                      <button
                        key={role.uuid}
                        onClick={() => setSelectedRoleId(role.uuid)}
                        className={`w-full flex items-center justify-between px-3 py-2.5  transition-all text-sm font-bold ${
                          selectedRoleId === role.uuid
                            ? "bg-blue-600 text-white shadow-sm"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {role.name}
                          {isRoot && (
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase font-bold">
                              System
                            </span>
                          )}
                        </span>
                        <ChevronRight
                          size={14}
                          className={
                            selectedRoleId === role.uuid
                              ? "opacity-100"
                              : "opacity-0"
                          }
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main
          className={`${canCreatePermission ? "lg:col-span-9" : "lg:col-span-12"} space-y-4`}
        >
          <header className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-black p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-transparent focus:border-blue-500 dark:focus:border-blue-600/50 text-sm outline-none transition-all text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {canUpdatePermission && (
              <button
                onClick={handleSave}
                disabled={loading || !selectedRoleId || isRootAdmin}
                className={`w-full sm:w-auto px-8 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] ${
                  isRootAdmin
                    ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Update Permissions
              </button>
            )}
          </header>

          {isRootAdmin && selectedRoleId && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Shield size={14} />
              The root_admin role has all permissions by default and cannot be
              modified.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading && filteredResources.length === 0
              ? [1, 2, 3, 4, 5, 6].map((i) => <ResourceCardSkeleton key={i} />)
              : filteredResources.map((resource) => (
                  <div
                    key={resource.name}
                    className={`bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800  shadow-sm h-fit overflow-hidden transition-opacity ${
                      loading || isRootAdmin
                        ? "opacity-50 pointer-events-none"
                        : "opacity-100"
                    }`}
                  >
                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/30">
                      <h3 className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                        <Lock size={12} className="text-blue-500" />
                        {resource.name}
                      </h3>
                      <button
                        onClick={() =>
                          selectAllForResource(resource.name, resource.actions)
                        }
                        className="text-[9px] font-black text-zinc-400 hover:text-blue-500 flex items-center gap-1 transition-colors uppercase"
                        disabled={isRootAdmin}
                      >
                        <CheckSquare size={10} /> Toggle All
                      </button>
                    </div>

                    <div className="p-2 grid grid-cols-2 gap-1">
                      {resource.actions.map((action) => {
                        const permName = `${action}_${resource.name.toLowerCase()}`;
                        const isChecked =
                          assignedPermissions.includes(permName);

                        return (
                          <label
                            key={permName}
                            className={`flex items-center gap-2 p-2 cursor-pointer group transition-all border ${
                              isChecked
                                ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-900 border-transparent"
                            } ${isRootAdmin ? "cursor-not-allowed" : ""}`}
                          >
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                className="peer appearance-none w-3.5 h-3.5 border border-zinc-300 dark:border-zinc-700 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer bg-transparent"
                                checked={isChecked}
                                onChange={() => togglePermission(permName)}
                                disabled={isRootAdmin}
                              />
                              <Check
                                size={10}
                                className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                                strokeWidth={4}
                              />
                            </div>
                            <span
                              className={`text-[11px] font-bold transition-colors capitalize ${
                                isChecked
                                  ? "text-blue-700 dark:text-blue-400"
                                  : "text-zinc-500 dark:text-zinc-400"
                              }`}
                            >
                              {action}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
          </div>

          {!loading && filteredResources.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-black border border-dashed border-zinc-300 dark:border-zinc-800">
              <Shield
                size={40}
                className="mx-auto text-zinc-200 dark:text-zinc-800 mb-2"
              />
              <p className="text-zinc-400 text-sm">
                No resources found matching your search.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
