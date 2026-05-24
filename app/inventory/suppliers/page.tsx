"use client";

import { useEffect } from "react";
import {
  Truck,
  Search,
  Edit2,
  Trash2,
  Star,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { useSupplierViewModel } from "./useSupplierViewModel";
import { Pagination } from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";

export default function SupplierManagementPage() {
  const {
    suppliersList,
    editingUuid,
    errors,
    formData,
    pageSize,
    totalCount,
    setFormData,
    handleSave,
    deleteSupplier,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    setCurrentPage,
    setPageSize,
    step,
    setStep, // <-- from view model
    nextStep,
    prevStep,
  } = useSupplierViewModel();

  const { hasPermission } = useAuth();
  const canCreateSupplier = hasPermission("create_suppliers");
  const canUpdateSupplier = hasPermission("edit_suppliers");
  const canDeleteSupplier = hasPermission("delete_suppliers");

  // Map each field to its step number
  const fieldToStep: Record<string, number> = {
    name: 1,
    country: 1,
    city: 1,
    contact_person: 2,
    email: 2,
    phone: 2,
    address: 2,
    tax_id: 3,
    registration_number: 3,
    payment_terms: 3,
    credit_limit: 3,
    payment_days: 3,
    bank_name: 4,
    bank_account_number: 4,
    is_preferred: 4,
    is_active: 4,
    // optional fields that might appear in errors
    alternative_phone: 2,
    website: 2,
    state: 1,
    postal_code: 1,
    bank_account_name: 4,
    bank_branch: 4,
    rating: 4,
    notes: 4,
  };

  // Jump to the step containing the first error and focus the field
  useEffect(() => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;

    // Find the first field that has an error and exists in the mapping
    const firstErrorField = errorKeys.find((key) => fieldToStep[key]);
    if (!firstErrorField) return;

    const targetStep = fieldToStep[firstErrorField];
    if (targetStep && targetStep !== step) {
      setStep(targetStep);
    }

    // Focus the field after step change (allow DOM to update)
    setTimeout(() => {
      const element = document.getElementById(`input-${firstErrorField}`);
      if (element) {
        element.focus();
        // If it's an input/textarea, also place cursor at end
        if ("setSelectionRange" in element) {
          const inputEl = element as HTMLInputElement | HTMLTextAreaElement;
          inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
        }
      }
    }, 100);
  }, [errors, step, setStep]);

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
        {(canCreateSupplier || (editingUuid && canUpdateSupplier)) && (
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm overflow-y-auto max-h-[100vh] no-scrollbar">
              <header className="mb-6">
                <h1 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                  <Truck className="text-blue-500" size={20} />
                  {editingUuid ? "Update Supplier" : "Register Supplier"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Manage procurement and vendor details.
                </p>
              </header>

              <form onSubmit={handleSave} className="space-y-4">
                {/* STEP INDICATOR */}
                <div className="flex gap-2 text-[10px] font-bold uppercase text-zinc-500">
                  <span className={step === 1 ? "text-blue-600" : ""}>
                    1. Basic
                  </span>
                  <span>→</span>
                  <span className={step === 2 ? "text-blue-600" : ""}>
                    2. Contact
                  </span>
                  <span>→</span>
                  <span className={step === 3 ? "text-blue-600" : ""}>
                    3. Legal
                  </span>
                  <span>→</span>
                  <span className={step === 4 ? "text-blue-600" : ""}>
                    4. Banking
                  </span>
                </div>

                {/* ================= STEP 1 ================= */}
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Supplier Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="input-name"
                        type="text"
                        placeholder="Company Name"
                        className={inputStyle("name")}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                      {errors.name && (
                        <p className="text-[10px] text-red-500 mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Operating Country
                      </label>
                      <input
                        id="input-country"
                        type="text"
                        placeholder="Country"
                        className={inputStyle("country")}
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Operating City
                      </label>
                      <input
                        id="input-city"
                        type="text"
                        placeholder="City"
                        className={inputStyle("city")}
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* ================= STEP 2 ================= */}
                {step === 2 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="input-contact_person"
                        type="text"
                        className={inputStyle("contact_person")}
                        value={formData.contact_person}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_person: e.target.value,
                          })
                        }
                      />
                      {errors.contact_person && (
                        <p className="text-[10px] text-red-500 mt-1">
                          {errors.contact_person}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Official Email Address
                      </label>
                      <input
                        id="input-email"
                        type="email"
                        placeholder="Email Address"
                        className={inputStyle("email")}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Office Phone Number
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="input-phone"
                        type="text"
                        placeholder="Phone"
                        className={inputStyle("phone")}
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                      {errors.phone && (
                        <p className="text-[10px] text-red-500 mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Company Address
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="input-address"
                        rows={2}
                        placeholder="Full Address"
                        className={inputStyle("address")}
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                      {errors.address && (
                        <p className="text-[10px] text-red-500 mt-1">
                          {errors.address}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ================= STEP 3 ================= */}
                {step === 3 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Tin Number
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="input-tax_id"
                        type="text"
                        placeholder="Tax ID"
                        className={inputStyle("tax_id")}
                        value={formData.tax_id}
                        onChange={(e) =>
                          setFormData({ ...formData, tax_id: e.target.value })
                        }
                      />
                      {errors.tax_id && (
                        <p className="text-[10px] text-red-500 mt-1">
                          {errors.tax_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Company Number
                      </label>
                      <input
                        id="input-registration_number"
                        type="text"
                        placeholder="Company Reg. Number"
                        className={inputStyle("registration_number")}
                        value={formData.registration_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            registration_number: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Payment Terms
                      </label>
                      <input
                        id="input-payment_terms"
                        type="text"
                        placeholder="Terms (e.g. Net 30)"
                        className={inputStyle("payment_terms")}
                        value={formData.payment_terms}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            payment_terms: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Credit Limit
                      </label>
                      <input
                        id="input-credit_limit"
                        type="number"
                        placeholder="Credit Limit"
                        className={inputStyle("credit_limit")}
                        value={formData.credit_limit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            credit_limit: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* ================= STEP 4 ================= */}
                {step === 4 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Preferred Bank Name
                      </label>
                      <input
                        id="input-bank_name"
                        type="text"
                        placeholder="Bank Name"
                        className={inputStyle("bank_name")}
                        value={formData.bank_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1 mb-1 block">
                        Cast Account
                      </label>
                      <input
                        id="input-bank_account_number"
                        type="text"
                        placeholder="Account Number"
                        className={inputStyle("bank_account_number")}
                        value={formData.bank_account_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bank_account_number: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* CHECKBOXES */}
                    <label className="flex items-center gap-2 col-span-2">
                      <input
                        id="input-is_preferred"
                        type="checkbox"
                        checked={formData.is_preferred}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_preferred: e.target.checked,
                          })
                        }
                      />
                      Preferred Supplier
                    </label>

                    <label className="flex items-center gap-2 col-span-2">
                      <input
                        id="input-is_active"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      Active Status
                    </label>
                  </div>
                )}

                {/* ================= NAVIGATION ================= */}
                <div className="flex gap-2 pt-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 border rounded-md text-xs"
                    >
                      Back
                    </button>
                  )}

                  {step < 4 && (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 bg-zinc-800 text-white py-2 rounded-md text-xs font-bold"
                    >
                      Next
                    </button>
                  )}

                  {step === 4 && (
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-md font-bold"
                    >
                      {editingUuid ? "Update Supplier" : "Save Supplier"}
                    </button>
                  )}

                  {editingUuid && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border rounded-md text-xs"
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
    ${canCreateSupplier || (editingUuid && canUpdateSupplier) ? "lg:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}
  `}
        >
          <div className="bg-white dark:bg-black p-4 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search suppliers..."
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
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Financials</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {suppliersList.map((supplier) => (
                  <tr
                    key={supplier.uuid}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors group text-xs"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {supplier.name}
                          </span>
                          {supplier.is_preferred && (
                            <Star
                              size={10}
                              className="fill-amber-400 text-amber-400"
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <MapPin size={10} /> {supplier.city},{" "}
                          {supplier.country}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Mail size={12} className="text-zinc-400" />{" "}
                          {supplier.email || "—"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone size={12} className="text-zinc-400" />{" "}
                          {supplier.phone || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                          Limit: Ugx {supplier.credit_limit.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {supplier.payment_terms || "No terms set"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {canUpdateSupplier && (
                          <button
                            onClick={() => startEdit(supplier)}
                            className="p-2 text-zinc-400 hover:text-blue-500"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}

                        {canDeleteSupplier && (
                          <button
                            onClick={() => deleteSupplier(supplier.uuid)}
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
