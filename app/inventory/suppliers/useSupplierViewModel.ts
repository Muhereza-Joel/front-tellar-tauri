"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { suppliers } from "../../../db/schemas/suppliers";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

const supplierSchema = yup.object({
  name: yup.string().required("Supplier name is required"),
  contact_person: yup
    .string()
    .required("Contact person is required")
    .transform((v) => (v === "" ? null : v)),
  email: yup
    .string()
    .email("Invalid email")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  phone: yup
    .string()
    .required("Phone number is required")
    .transform((v) => (v === "" ? null : v)),
  alternative_phone: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  website: yup
    .string()
    .url("Invalid URL")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  address: yup
    .string()
    .required("Address is required")
    .transform((v) => (v === "" ? null : v)),
  city: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  state: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  country: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  postal_code: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  tax_id: yup
    .string()
    .required("Tax ID is required")
    .transform((v) => (v === "" ? null : v)),
  registration_number: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  payment_terms: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  credit_limit: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .default(0),
  payment_days: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .default(0),
  bank_name: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  bank_account_name: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  bank_account_number: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  bank_branch: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  is_active: yup.boolean().default(true),
  is_preferred: yup.boolean().default(false),
  rating: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .default(0),
  notes: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

export function useSupplierViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [step, setStep] = useState(1);

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    alternative_phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    tax_id: "",
    registration_number: "",
    payment_terms: "",
    credit_limit: 0,
    payment_days: 0,
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_branch: "",
    is_active: true,
    is_preferred: false,
    rating: 0,
    notes: "",
  });

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
    searchTerm,
    setSearchTerm,
  } = usePagination({
    data: suppliersList,
    initialPageSize: 10,
    searchKeys: ["name", "contact_person", "email", "city"],
  });

  useEffect(() => {
    getDatabase()
      .then(setDb)
      .catch(() => setLoading(false));
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.suppliers.findMany({
        where: (s: any, { isNull }: any) => isNull(s.deleted_at),
        orderBy: (s: any, { asc }: any) => asc(s.name),
      });
      setSuppliersList(results);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    if (db) loadData();
  }, [db]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const normalizedInputName = (formData.name || "").trim().toLowerCase();

    // In-memory duplicate prevention layer optimization check
    const isDuplicateName = suppliersList.some(
      (s: any) =>
        (s?.name || "").trim().toLowerCase() === normalizedInputName &&
        s.uuid !== editingUuid,
    );

    if (isDuplicateName && normalizedInputName.length > 0) {
      setErrors({
        name: "A supplier with this name already exists",
      });
      return;
    }

    try {
      const valid = await supplierSchema.validate(formData, {
        abortEarly: false,
      });

      if (!db) return;

      const tenantId = getTenantId();

      if (editingUuid) {
        await db
          .update(suppliers)
          .set({
            ...valid,
            sync_status: "updated",
          })
          .where(eq(suppliers.uuid, editingUuid));
      } else {
        await db.insert(suppliers).values({
          uuid: uuidv7(),
          ...valid,
          sync_status: "created",
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
        });
      }

      resetForm();
      await loadData();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const mappedErrors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) mappedErrors[e.path] = e.message;
        });
        setErrors(mappedErrors);
      } else {
        const errorMessage = String(err?.message || err);
        if (errorMessage.includes("UNIQUE") || errorMessage.includes("2067")) {
          setErrors({
            name: "A supplier with this name already exists",
          });
        } else {
          setErrors({
            submit: "An unexpected storage error occurred. Please try again.",
          });
        }
        console.error("Caught persistence layer exception:", err);
      }
    }
  };

  const deleteSupplier = async (uuid: string) => {
    if (!db) return;
    try {
      await db
        .update(suppliers)
        .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
        .where(eq(suppliers.uuid, uuid));
      await loadData();
    } catch (error) {
      console.error("Failed to delete supplier:", error);
    }
  };

  const startEdit = (supplier: any) => {
    setEditingUuid(supplier.uuid);
    setFormData({
      ...supplier,
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      alternative_phone: supplier.alternative_phone || "",
      website: supplier.website || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      country: supplier.country || "",
      postal_code: supplier.postal_code || "",
      tax_id: supplier.tax_id || "",
      registration_number: supplier.registration_number || "",
      payment_terms: supplier.payment_terms || "",
      bank_name: supplier.bank_name || "",
      bank_account_name: supplier.bank_account_name || "",
      bank_account_number: supplier.bank_account_number || "",
      bank_branch: supplier.bank_branch || "",
      notes: supplier.notes || "",
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      alternative_phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      tax_id: "",
      registration_number: "",
      payment_terms: "",
      credit_limit: 0,
      payment_days: 0,
      bank_name: "",
      bank_account_name: "",
      bank_account_number: "",
      bank_branch: "",
      is_active: true,
      is_preferred: false,
      rating: 0,
      notes: "",
    });
    setErrors({});
  };

  return {
    suppliersList: paginatedData,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleSave,
    deleteSupplier,
    startEdit,
    resetForm,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setCurrentPage,
    setPageSize,
    searchTerm,
    setSearchTerm,
    step,
    setStep, // <-- added
    nextStep,
    prevStep,
  };
}
