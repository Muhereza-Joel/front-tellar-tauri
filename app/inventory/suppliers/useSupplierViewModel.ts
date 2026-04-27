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
  contact_person: yup.string().nullable(),
  email: yup.string().email("Invalid email").nullable(),
  phone: yup.string().nullable(),
  alternative_phone: yup.string().nullable(),
  website: yup.string().url("Invalid URL").nullable(),
  address: yup.string().nullable(),
  city: yup.string().nullable(),
  state: yup.string().nullable(),
  country: yup.string().nullable(),
  postal_code: yup.string().nullable(),
  tax_id: yup.string().nullable(),
  registration_number: yup.string().nullable(),
  payment_terms: yup.string().nullable(),
  credit_limit: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .default(0),
  payment_days: yup
    .number()
    .integer()
    .transform((v) => (isNaN(v) ? 0 : v))
    .default(0),
  bank_name: yup.string().nullable(),
  bank_account_name: yup.string().nullable(),
  bank_account_number: yup.string().nullable(),
  bank_branch: yup.string().nullable(),
  is_active: yup.boolean().default(true),
  is_preferred: yup.boolean().default(false),
  rating: yup.number().integer().min(0).max(5).default(0),
  notes: yup.string().nullable(),
});

export function useSupplierViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

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
    searchKeys: ["name", "contact_person", "email", "tax_id"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.suppliers.findMany({
        where: (s: any, { isNull }: any) => isNull(s.deleted_at),
        orderBy: (s: any, { asc }: any) => asc(s.name),
      });
      setSuppliersList(results);
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

    try {
      const valid = await supplierSchema.validate(formData, {
        abortEarly: false,
      });

      if (editingUuid) {
        await db
          .update(suppliers)
          .set(valid, { sync_status: "updated" })
          .where(eq(suppliers.uuid, editingUuid));
      } else {
        await db.insert(suppliers).values({
          uuid: uuidv7(),
          ...valid,
          sync_status: "created",
          tenant_id: getTenantId(),
          created_at: new Date().toISOString(),
        });
      }

      resetForm();
      loadData();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const mappedErrors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) mappedErrors[e.path] = e.message;
        });
        setErrors(mappedErrors);
      }
    }
  };

  const deleteSupplier = async (uuid: string) => {
    if (!db) return;
    await db
      .update(suppliers)
      .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
      .where(eq(suppliers.uuid, uuid));
    loadData();
  };

  const startEdit = (supplier: any) => {
    setEditingUuid(supplier.uuid);
    setFormData({ ...supplier });
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
  };
}
