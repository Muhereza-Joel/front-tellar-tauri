"use client";

import {
  Edit2,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Search,
  Plus,
  FileText,
  XCircle,
} from "lucide-react";
import { useCustomerViewModel } from "./useCustomerViewModel";
import { FormSkeleton, TableRowSkeleton } from "../components/Skeletons";
import { Pagination } from "../components/Pagination";
import ConfirmDeleteButton from "../components/ConfirmDeleteButton";

export default function CustomerManagementPage() {
  const {
    customersList,
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
    deleteCustomer,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
  } = useCustomerViewModel();

  // Updated for GitHub Black: bg-black, sharp corners (rounded-md), and subtle borders
  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm outline-none transition-all
    ${
      errors[fieldName]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-2 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* SIDEBAR FORM */}
        <section className="lg:col-span-4 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm h-fit sticky top-6">
          {loading ? (
            <FormSkeleton />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-2">
                  <UserPlus size={16} />{" "}
                  {editingUuid ? "Edit Customer" : "New Customer"}
                </h2>
                {editingUuid && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${formData.is_active ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}
                  >
                    {formData.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className={inputClass("first_name")}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className={inputClass("last_name")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={inputClass("email")}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className={inputClass("phone")}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      DOB
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_of_birth: e.target.value,
                        })
                      }
                      className={inputClass("date_of_birth")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      Home Country
                    </label>
                    <input
                      type="text"
                      value={formData.country || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className={inputClass("country")}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                      District/City
                    </label>
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className={inputClass("city")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className={`${inputClass("address")} resize-none`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold mb-1 text-zinc-500 uppercase">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className={`${inputClass("notes")} resize-none`}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_walk_in}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_walk_in: e.target.checked,
                        })
                      }
                      className="rounded-sm border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-transparent"
                    />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 transition-colors">
                      Walk-in
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="rounded-sm border-zinc-300 dark:border-zinc-700 text-green-600 focus:ring-0 bg-transparent"
                    />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-green-600 transition-colors">
                      Active Account
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                >
                  {editingUuid ? <Edit2 size={18} /> : <Plus size={18} />}
                  {editingUuid ? "Update Customer" : "Create Customer"}
                </button>
                {editingUuid && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full text-zinc-500 dark:text-zinc-400 text-xs font-bold py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors mt-1"
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          )}
        </section>

        {/* MAIN TABLE SECTION */}
        <section className="lg:col-span-8">
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th colSpan={4} className="px-6 py-4">
                    <div className="relative group">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-md pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-zinc-900 dark:text-zinc-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </th>
                </tr>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Location & Info</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading ? (
                  <TableRowSkeleton />
                ) : (
                  customersList.map((customer) => (
                    <tr
                      key={customer.uuid}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 group transition-colors text-xs"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {customer.first_name} {customer.last_name}
                            </span>
                            {!customer.is_active && (
                              <XCircle size={12} className="text-red-400" />
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-bold w-fit px-1.5 rounded-sm ${customer.is_walk_in ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}
                          >
                            {customer.is_walk_in ? "WALK-IN" : "REGISTERED"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Mail size={12} className="text-zinc-400" />{" "}
                            {customer.email}
                          </span>
                          {customer.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={12} className="text-zinc-400" />{" "}
                              {customer.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[10px] text-zinc-400 uppercase">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {customer.city || "N/A"}
                            {customer.country ? `, ${customer.country}` : ""}
                          </span>
                          {customer.notes && (
                            <span className="flex items-center gap-1 italic lowercase">
                              <FileText size={12} />{" "}
                              {customer.notes.substring(0, 20)}...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(customer)}
                            className="p-2 text-zinc-400 hover:text-blue-500"
                          >
                            <Edit2 size={16} />
                          </button>

                          <ConfirmDeleteButton
                            onConfirm={() => deleteCustomer(customer.uuid)}
                            itemName={`${customer.first_name} ${customer.last_name}`}
                            title="Delete Customer"
                            confirmText="Delete"
                            cancelText="Cancel"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
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
