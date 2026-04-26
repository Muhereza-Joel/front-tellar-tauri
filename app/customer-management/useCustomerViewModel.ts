"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../db";
import { customers } from "../../db/schemas/customer";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../hooks/usePagination";
import { useAuth } from "../context/AuthContext";

const customerSchema = yup.object({
  first_name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  date_of_birth: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  address: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  city: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  country: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  notes: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  is_active: yup.boolean().default(true),
  is_walk_in: yup.boolean().default(false),
});

export function useCustomerViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    city: "",
    country: "",
    notes: "",
    is_active: true,
    is_walk_in: false,
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
    data: customersList,
    initialPageSize: 10,
    searchKeys: [
      "first_name",
      "last_name",
      "email",
      "phone",
      "city",
      "country",
    ],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.customers.findMany({
        where: (c: any, { isNull }: any) => isNull(c.deleted_at),
        orderBy: (c: any, { desc }: any) => desc(c.created_at),
      });
      setCustomersList(results);
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
      const valid = await customerSchema.validate(formData, {
        abortEarly: false,
      });

      if (editingUuid) {
        await db
          .update(customers)
          .set({
            ...valid,
            // Ensure boolean is handled correctly for SQLite/Drizzle if necessary
            sync_status: "updated",
            is_active: valid.is_active ? true : false,
            updated_at: new Date().toISOString(),
          })
          .where(eq(customers.uuid, editingUuid));
      } else {
        await db.insert(customers).values({
          uuid: uuidv7(),
          ...valid,
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

  const deleteCustomer = async (uuid: string) => {
    if (!db) return;
    await db
      .update(customers)
      .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
      .where(eq(customers.uuid, uuid));
    loadData();
  };

  const startEdit = (customer: any) => {
    setEditingUuid(customer.uuid);
    setFormData({
      ...customer,
      // Ensure nulls from DB don't cause issues with controlled inputs
      phone: customer.phone || "",
      date_of_birth: customer.date_of_birth || "",
      address: customer.address || "",
      city: customer.city || "",
      country: customer.country || "",
      notes: customer.notes || "",
      is_active: Boolean(customer.is_active),
      is_walk_in: Boolean(customer.is_walk_in),
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      address: "",
      city: "",
      country: "",
      notes: "",
      is_active: true,
      is_walk_in: false,
    });
    setErrors({});
  };

  return {
    customersList: paginatedData,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleSave,
    deleteCustomer,
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
