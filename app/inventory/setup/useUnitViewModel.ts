"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { units } from "../../../db/schemas/units";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

// Auto-trim values and ensure whitespace-only triggers required validation
const unitSchema = yup.object({
  name: yup.string().trim().required("Unit name is required"),
  singular: yup.string().trim().required("Singular label is required"),
  plural: yup.string().trim().required("Plural label is required"),
  description: yup
    .string()
    .trim()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  is_active: yup.boolean().default(true),
});

export function useUnitViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  // Add this function right after your useState hooks:
  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // If an error exists for this field, clear it immediately as the user types
    if (errors[field]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    singular: "",
    plural: "",
    description: "",
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
    data: unitsList,
    initialPageSize: 10,
    searchKeys: ["name", "singular", "plural"],
  });

  useEffect(() => {
    getDatabase()
      .then(setDb)
      .catch(() => setLoading(false)); // Gracefully handle connection drops on load
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.units.findMany({
        where: (u: any, { isNull }: any) => isNull(u.deleted_at),
        orderBy: (u: any, { asc }: any) => asc(u.name),
      });
      setUnitsList(results);
    } catch (error) {
      console.error("Failed to load units database data:", error);
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
      const valid = await unitSchema.validate(formData, { abortEarly: false });

      if (editingUuid) {
        await db
          .update(units)
          .set({ ...valid, sync_status: "updated" })
          .where(eq(units.uuid, editingUuid));
      } else {
        await db.insert(units).values({
          uuid: uuidv7(),
          ...valid,
          sync_status: "created",
          tenant_id: getTenantId(),
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
      }
    }
  };

  const deleteUnit = async (uuid: string) => {
    if (!db) return;
    try {
      await db
        .update(units)
        .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
        .where(eq(units.uuid, uuid));
      await loadData();
    } catch (error) {
      console.error("Failed to delete unit:", error);
    }
  };

  const startEdit = (unit: any) => {
    setEditingUuid(unit.uuid);
    setFormData({
      ...unit,
      description: unit.description || "",
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      name: "",
      singular: "",
      plural: "",
      description: "",
      is_active: true,
    });
    setErrors({});
  };

  return {
    unitsList: paginatedData,
    loading,
    editingUuid,
    errors,
    formData,
    updateField,
    handleSave,
    deleteUnit,
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
