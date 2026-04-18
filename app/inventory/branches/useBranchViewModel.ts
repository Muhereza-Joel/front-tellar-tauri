"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { branches } from "../../../db/schemas/branches"; // Assuming your schema file name
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";

const branchSchema = yup.object({
  name: yup.string().required("Branch name is required"),
  email: yup
    .string()
    .email("Invalid email")
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  phone: yup
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
  is_main: yup.boolean().default(false),
  is_active: yup.boolean().default(true),
});

export function useBranchViewModel() {
  const [db, setDb] = useState<any>(null);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    notes: "",
    is_main: false,
    is_active: true,
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
    data: branchesList,
    initialPageSize: 10,
    searchKeys: ["name", "email", "city", "country"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.branches.findMany({
        where: (b: any, { isNull }: any) => isNull(b.deleted_at),
        orderBy: (b: any, { desc }: any) => desc(b.created_at),
      });
      setBranchesList(results);
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
      const valid = await branchSchema.validate(formData, {
        abortEarly: false,
      });

      if (editingUuid) {
        await db
          .update(branches)
          .set(valid)
          .where(eq(branches.uuid, editingUuid));
      } else {
        await db.insert(branches).values({
          uuid: uuidv7(),
          ...valid,
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

  const deleteBranch = async (uuid: string) => {
    if (!db) return;
    await db
      .update(branches)
      .set({ deleted_at: new Date().toISOString() })
      .where(eq(branches.uuid, uuid));
    loadData();
  };

  const startEdit = (branch: any) => {
    setEditingUuid(branch.uuid);
    setFormData({
      ...branch,
      email: branch.email || "",
      phone: branch.phone || "",
      address: branch.address || "",
      city: branch.city || "",
      country: branch.country || "",
      notes: branch.notes || "",
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      notes: "",
      is_main: false,
      is_active: true,
    });
    setErrors({});
  };

  return {
    branchesList: paginatedData,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleSave,
    deleteBranch,
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
