"use client";

import { useState } from "react";
import {
  Clock,
  Search,
  Plus,
  DollarSign,
  Percent,
  Layers,
  Tag,
  Info,
  Calendar,
  Truck,
  Database,
  Trash2,
  X,
  Edit2,
} from "lucide-react";
import { SearchableDropdown } from "@luciodale/react-searchable-dropdown";
import "@luciodale/react-searchable-dropdown/dist/assets/single-style.css";
import { useServicesViewModel } from "./useServicesViewModel";
import { FormSkeleton, TableRowSkeleton } from "../../components/Skeletons";
import { Pagination } from "../../components/Pagination";
import { Tabs } from "../../components/Tabs";

type TimeSlot = { start: string; end: string };
type DaySchedule = { day: string; slots: TimeSlot[] };
type MetadataEntry = { key: string; value: string };

export default function ServicesPage() {
  // ---------- TAB STATE: "list" or "form" ----------
  const [activeView, setActiveView] = useState<"list" | "form">("list");

  // ---------- Existing form tab state (unchanged) ----------
  const [activeTab, setActiveTab] = useState<
    "general" | "pricing" | "rental" | "availability" | "metadata"
  >("general");

  // ---------- All existing ViewModel hooks (unchanged) ----------
  const {
    servicesList,
    categoriesList,
    brandsList,
    loading,
    editingUuid,
    errors,
    formData,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    handleNumericChange,
    formatDisplay,
    setPageSize,
    setCurrentPage,
    setFormData,
    handleSave,
    deleteService,
    startEdit,
    resetForm,
    searchTerm,
    setSearchTerm,
  } = useServicesViewModel();

  // ---------- Repeaters (unchanged) ----------
  const [availabilityList, setAvailabilityList] = useState<DaySchedule[]>(() =>
    convertAvailabilityToArray(formData.availability_schedule),
  );
  const [metadataList, setMetadataList] = useState<MetadataEntry[]>(() =>
    convertMetadataToArray(formData.metadata),
  );

  function convertAvailabilityToArray(schedule: any): DaySchedule[] {
    if (!schedule || typeof schedule !== "object") return [];
    return Object.entries(schedule).map(([day, slots]) => ({
      day,
      slots: (slots as string[]).map((range) => {
        const [start, end] = range.split("-");
        return { start: start || "09:00", end: end || "17:00" };
      }),
    }));
  }

  function convertArrayToAvailability(
    arr: DaySchedule[],
  ): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    arr.forEach(({ day, slots }) => {
      if (slots.length > 0) {
        result[day] = slots.map((s) => `${s.start}-${s.end}`);
      }
    });
    return result;
  }

  function convertMetadataToArray(meta: Record<string, any>): MetadataEntry[] {
    return Object.entries(meta).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  }

  function convertArrayToMetadata(arr: MetadataEntry[]): Record<string, any> {
    const result: Record<string, any> = {};
    arr.forEach(({ key, value }) => {
      if (key.trim()) result[key.trim()] = value;
    });
    return result;
  }

  const updateAvailability = (newList: DaySchedule[]) => {
    setAvailabilityList(newList);
    setFormData({
      ...formData,
      availability_schedule: convertArrayToAvailability(newList),
    });
  };

  const updateMetadata = (newList: MetadataEntry[]) => {
    setMetadataList(newList);
    setFormData({
      ...formData,
      metadata: convertArrayToMetadata(newList),
    });
  };

  // Enhanced edit: switch to form tab + load service
  const handleStartEdit = (service: any) => {
    startEdit(service);
    setActiveView("form"); // <-- automatically show form tab
    setTimeout(() => {
      setAvailabilityList(
        convertAvailabilityToArray(service.availability_schedule || {}),
      );
      setMetadataList(convertMetadataToArray(service.metadata || {}));
    }, 0);
  };

  const handleReset = () => {
    resetForm();
    setAvailabilityList([]);
    setMetadataList([]);
    setActiveView("list"); // optional: go back to list after cancel
  };

  // New service button (from list view)
  const handleNewService = () => {
    resetForm();
    setAvailabilityList([]);
    setMetadataList([]);
    setActiveView("form");
  };

  // Repeater actions (unchanged)
  const addDaySchedule = () => {
    updateAvailability([
      ...availabilityList,
      { day: "monday", slots: [{ start: "09:00", end: "17:00" }] },
    ]);
  };
  const removeDaySchedule = (index: number) => {
    const newList = [...availabilityList];
    newList.splice(index, 1);
    updateAvailability(newList);
  };
  const updateDay = (index: number, day: string) => {
    const newList = [...availabilityList];
    newList[index].day = day;
    updateAvailability(newList);
  };
  const addTimeSlot = (dayIndex: number) => {
    const newList = [...availabilityList];
    newList[dayIndex].slots.push({ start: "09:00", end: "17:00" });
    updateAvailability(newList);
  };
  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newList = [...availabilityList];
    newList[dayIndex].slots.splice(slotIndex, 1);
    if (newList[dayIndex].slots.length === 0) {
      newList.splice(dayIndex, 1);
    }
    updateAvailability(newList);
  };
  const updateTimeSlot = (
    dayIndex: number,
    slotIndex: number,
    field: "start" | "end",
    value: string,
  ) => {
    const newList = [...availabilityList];
    newList[dayIndex].slots[slotIndex][field] = value;
    updateAvailability(newList);
  };
  const addMetadataEntry = () => {
    updateMetadata([...metadataList, { key: "", value: "" }]);
  };
  const removeMetadataEntry = (index: number) => {
    const newList = [...metadataList];
    newList.splice(index, 1);
    updateMetadata(newList);
  };
  const updateMetadataEntry = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    const newList = [...metadataList];
    newList[index][field] = val;
    updateMetadata(newList);
  };

  // Helper classes (unchanged)
  const inputClass = (fieldName: string) => `
    w-full bg-white dark:bg-black border rounded-md px-3 py-2 text-sm outline-none transition-all
    ${
      errors[fieldName]
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600/50"
    }
  `;
  const labelClass =
    "text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block";

  const TabButton = ({
    id,
    label,
    icon: Icon,
  }: {
    id: string;
    label: string;
    icon: any;
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
        activeTab === id
          ? "bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-blue-400"
          : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-2 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* ----- TABBED RIBBON (List / Form) ----- */}
        <Tabs
          tabs={[
            { id: "list", label: "Services List", icon: Database },
            {
              id: "form",
              label: "Service Form",
              icon: Edit2,
              badge: editingUuid ? "Edit" : undefined,
            },
          ]}
          activeTab={activeView}
          onChange={(id) => setActiveView(id as "list" | "form")}
          variant="default"
          className="mb-6"
        />

        {/* ----- LIST VIEW (TABLE) ----- */}
        {activeView === "list" && (
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search services, categories..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-md pl-10 pr-4 py-2 text-sm outline-none text-zinc-900 dark:text-zinc-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={handleNewService}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-md"
              >
                <Plus size={14} /> New Service
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Service & Identity</th>
                    <th className="px-6 py-4">Pricing/Tax</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {loading ? (
                    <TableRowSkeleton />
                  ) : (
                    servicesList.map((s) => (
                      <tr
                        key={s.uuid}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 group transition-colors text-xs"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                              {s.name}
                              {!s.is_active && (
                                <span className="text-[9px] bg-red-100 text-red-600 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                                  INACTIVE
                                </span>
                              )}
                            </span>
                            <div className="flex gap-2 flex-wrap">
                              <span className="flex items-center gap-1 text-[9px] text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                                <Layers size={10} />{" "}
                                {categoriesList.find(
                                  (c) => c.uuid === s.category_id,
                                )?.name || "No Cat"}
                              </span>
                              {s.brand_id && (
                                <span className="flex items-center gap-1 text-[9px] text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                                  <Tag size={10} />{" "}
                                  {
                                    brandsList.find(
                                      (b) => b.uuid === s.brand_id,
                                    )?.name
                                  }
                                </span>
                              )}
                              {s.is_rental && (
                                <span className="flex items-center gap-1 text-[9px] text-purple-600 uppercase bg-purple-100 dark:bg-purple-900/30 px-1 rounded">
                                  <Truck size={10} /> Rental
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-800 dark:text-zinc-100">
                              ${s.base_price.toLocaleString()}
                              {s.is_rental && (
                                <span className="text-[10px] text-zinc-500 font-normal">
                                  {" "}
                                  / {s.rental_rate_unit}
                                </span>
                              )}
                            </span>
                            <span className="text-[9px] text-zinc-500">
                              Tax: {s.tax_rate}%{" "}
                              {s.is_tax_inclusive ? "(Inc)" : "(Exc)"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                              <Clock size={12} /> {s.duration_minutes || "—"}{" "}
                              min
                            </span>
                            {s.requires_appointment && (
                              <span className="text-[9px] bg-blue-100 text-blue-600 dark:bg-blue-900/30 px-1.5 rounded-sm inline-flex items-center gap-1 w-fit">
                                <Calendar size={10} /> Appointment
                              </span>
                            )}
                            {s.max_bookings_per_slot > 1 && (
                              <span className="text-[9px] bg-orange-100 text-orange-600 dark:bg-orange-900/30 px-1.5 rounded-sm w-fit">
                                Group: {s.max_bookings_per_slot}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(s)}
                              className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteService(s.uuid)}
                              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
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
          </div>
        )}

        {/* ----- FORM VIEW (unchanged structure, but wrapped) ----- */}
        {activeView === "form" && (
          <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
            {loading ? (
              <FormSkeleton />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-2">
                    <Edit2 size={16} />
                    {editingUuid ? "Update Service" : "New Service"}
                  </h2>
                  {editingUuid && (
                    <button
                      onClick={handleReset}
                      className="text-[10px] bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-md font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    >
                      CANCEL & BACK TO LIST
                    </button>
                  )}
                </div>

                <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-2 overflow-x-auto">
                  <TabButton id="general" label="General" icon={Info} />
                  <TabButton id="pricing" label="Pricing" icon={DollarSign} />
                  <TabButton id="rental" label="Rental" icon={Truck} />
                  <TabButton
                    id="availability"
                    label="Availability"
                    icon={Calendar}
                  />
                  <TabButton id="metadata" label="Metadata" icon={Database} />
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  {/* All your existing form fields – exactly as they were */}
                  {activeTab === "general" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1">
                      {/* ... same general fields ... */}
                      <div>
                        <label className={labelClass}>Service Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className={inputClass("name")}
                          placeholder="e.g., Haircut, Oil Change"
                        />
                        {errors.name && (
                          <p className="text-red-500 text-[10px] mt-1 font-bold">
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                          rows={3}
                          value={formData.description || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className={inputClass("description")}
                          placeholder="Detailed description..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Category</label>
                          <SearchableDropdown
                            options={categoriesList.map((c) => c.name)}
                            value={
                              categoriesList.find(
                                (c) => c.uuid === formData.category_id,
                              )?.name
                            }
                            setValue={(val: string) => {
                              const selected = categoriesList.find(
                                (c) => c.name === val,
                              );
                              setFormData({
                                ...formData,
                                category_id: selected?.uuid || "",
                              });
                            }}
                            placeholder="Search Category"
                            createNewOptionIfNoMatch={false}
                            dropdownOptionNoMatchLabel="No categories found"
                            dropdownOptionsHeight={320}
                            debounceDelay={100}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Brand</label>
                          <SearchableDropdown
                            options={brandsList.map((b) => b.name)}
                            value={
                              brandsList.find(
                                (b) => b.uuid === formData.brand_id,
                              )?.name
                            }
                            setValue={(val: string) => {
                              const selected = brandsList.find(
                                (b) => b.name === val,
                              );
                              setFormData({
                                ...formData,
                                brand_id: selected?.uuid || "",
                              });
                            }}
                            placeholder="Search Brand"
                            createNewOptionIfNoMatch={false}
                            dropdownOptionNoMatchLabel="No brands found"
                            dropdownOptionsHeight={320}
                            debounceDelay={100}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={formData.duration_minutes || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                duration_minutes: parseInt(e.target.value) || 0,
                              })
                            }
                            className={inputClass("duration_minutes")}
                            placeholder="60"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Max Bookings Per Slot
                          </label>
                          <input
                            type="number"
                            value={formData.max_bookings_per_slot}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                max_bookings_per_slot:
                                  parseInt(e.target.value) || 1,
                              })
                            }
                            className={inputClass("max_bookings_per_slot")}
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-6 pt-2">
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
                            className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-transparent"
                          />
                          <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                            Active
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.requires_appointment}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                requires_appointment: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-transparent"
                          />
                          <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                            Requires Appointment
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === "pricing" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Base Price</label>
                          <div className="relative">
                            <DollarSign
                              className="absolute left-2.5 top-2.5 text-zinc-400"
                              size={14}
                            />
                            <input
                              type="text"
                              className={`${inputClass("base_price")} pl-8`}
                              value={formatDisplay(formData.base_price)}
                              onChange={(e) =>
                                handleNumericChange(
                                  "base_price",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Tax Rate (%)</label>
                          <div className="relative">
                            <Percent
                              className="absolute left-2.5 top-2.5 text-zinc-400"
                              size={14}
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={formData.tax_rate}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  tax_rate: parseFloat(e.target.value) || 0,
                                })
                              }
                              className={`${inputClass("tax_rate")} pl-8`}
                            />
                          </div>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_tax_inclusive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_tax_inclusive: e.target.checked,
                            })
                          }
                          className="rounded-sm border-zinc-300 dark:border-zinc-700 text-blue-600 bg-transparent"
                        />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                          Price includes Tax
                        </span>
                      </label>
                    </div>
                  )}

                  {activeTab === "rental" && (
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_rental}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_rental: e.target.checked,
                            })
                          }
                          className="rounded-sm border-zinc-300 dark:border-zinc-700 text-blue-600 bg-transparent"
                        />
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                          Enable Rental Mode
                        </span>
                      </label>
                      {formData.is_rental && (
                        <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-md">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelClass}>
                                Deposit Required
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.deposit_required}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    deposit_required:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                className={inputClass("deposit_required")}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>
                                Rental Rate Unit
                              </label>
                              <select
                                value={formData.rental_rate_unit || "hour"}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    rental_rate_unit: e.target.value,
                                  })
                                }
                                className={inputClass("rental_rate_unit")}
                              >
                                <option value="hour">Hour</option>
                                <option value="day">Day</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>
                              Late Fee (per unit)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.late_fee_per_unit}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  late_fee_per_unit:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className={inputClass("late_fee_per_unit")}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "availability" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className={labelClass}>Weekly Schedule</label>
                        <button
                          type="button"
                          onClick={addDaySchedule}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Day
                        </button>
                      </div>
                      {availabilityList.length === 0 && (
                        <div className="text-center py-6 border border-dashed rounded-md text-zinc-400 text-xs">
                          No schedule defined. Click "Add Day" to set
                          availability.
                        </div>
                      )}
                      {availabilityList.map((daySchedule, dayIdx) => (
                        <div
                          key={dayIdx}
                          className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <select
                              value={daySchedule.day}
                              onChange={(e) =>
                                updateDay(dayIdx, e.target.value)
                              }
                              className="text-xs font-bold bg-transparent border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1"
                            >
                              {daysOfWeek.map((d) => (
                                <option key={d} value={d}>
                                  {d.charAt(0).toUpperCase() + d.slice(1)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeDaySchedule(dayIdx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="space-y-2 pl-2">
                            {daySchedule.slots.map((slot, slotIdx) => (
                              <div
                                key={slotIdx}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) =>
                                    updateTimeSlot(
                                      dayIdx,
                                      slotIdx,
                                      "start",
                                      e.target.value,
                                    )
                                  }
                                  className="w-24 px-2 py-1 text-xs border rounded bg-white dark:bg-black"
                                />
                                <span className="text-xs">–</span>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) =>
                                    updateTimeSlot(
                                      dayIdx,
                                      slotIdx,
                                      "end",
                                      e.target.value,
                                    )
                                  }
                                  className="w-24 px-2 py-1 text-xs border rounded bg-white dark:bg-black"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeTimeSlot(dayIdx, slotIdx)
                                  }
                                  className="text-zinc-400 hover:text-red-500"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addTimeSlot(dayIdx)}
                              className="text-[10px] text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-1"
                            >
                              <Plus size={10} /> Add time slot
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "metadata" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className={labelClass}>
                          Custom Fields (Key / Value)
                        </label>
                        <button
                          type="button"
                          onClick={addMetadataEntry}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Field
                        </button>
                      </div>
                      {metadataList.length === 0 && (
                        <div className="text-center py-6 border border-dashed rounded-md text-zinc-400 text-xs">
                          No custom metadata. Click "Add Field" to add key-value
                          pairs.
                        </div>
                      )}
                      {metadataList.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Key"
                            value={entry.key}
                            onChange={(e) =>
                              updateMetadataEntry(idx, "key", e.target.value)
                            }
                            className="flex-1 px-2 py-1 text-xs border rounded bg-white dark:bg-black"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={entry.value}
                            onChange={(e) =>
                              updateMetadataEntry(idx, "value", e.target.value)
                            }
                            className="flex-1 px-2 py-1 text-xs border rounded bg-white dark:bg-black"
                          />
                          <button
                            type="button"
                            onClick={() => removeMetadataEntry(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {editingUuid ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingUuid ? "Update Service" : "Create Service"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
