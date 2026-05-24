"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { categories } from "../../../db/schemas/category";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

const categorySchema = yup.object({
  name: yup.string().trim().required("Category name is required"),
  parent_id: yup
    .string()
    .trim()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

export function useCategoryViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    name: "",
    parent_id: "",
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
    data: categoriesList,
    initialPageSize: 10,
    searchKeys: ["name"],
  });

  useEffect(() => {
    getDatabase()
      .then(setDb)
      .catch(() => setLoading(false));
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.categories.findMany({
        where: (c: any, { isNull }: any) => isNull(c.deleted_at),
        orderBy: (c: any, { asc }: any) => asc(c.name),
      });
      setCategoriesList(results);
    } catch (error) {
      console.error("Failed to load categories database data:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    if (db) loadData();
  }, [db]);

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev: any) => {
      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });

    if (field === "parent_id" && editingUuid && value === editingUuid) {
      setErrors((prev: any) => ({
        ...prev,
        parent_id: "A category cannot be its own parent",
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (editingUuid && formData.parent_id === editingUuid) {
      setErrors({ parent_id: "A category cannot be its own parent" });
      return;
    }

    // 1. Proactive Client-Side Duplication Check
    const normalizedInputName = formData.name.trim().toLowerCase();
    const isDuplicateName = categoriesList.some(
      (cat) =>
        cat.name.trim().toLowerCase() === normalizedInputName &&
        cat.uuid !== editingUuid, // Allow if editing the same record
    );

    if (isDuplicateName) {
      setErrors({ name: "A category with this name already exists" });
      return;
    }

    try {
      const valid = await categorySchema.validate(formData, {
        abortEarly: false,
      });

      if (editingUuid) {
        await db
          .update(categories)
          .set({ ...valid, sync_status: "updated" })
          .where(eq(categories.uuid, editingUuid));
      } else {
        await db.insert(categories).values({
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
      } else {
        // 2. Fallback Database Level Interceptor (e.g. Unique constraints or network race conditions)
        const errorMessage = String(err?.message || err);
        if (errorMessage.includes("UNIQUE") || errorMessage.includes("2067")) {
          setErrors({ name: "A category with this name already exists" });
        } else {
          setErrors({
            submit: "An unexpected storage error occurred. Please try again.",
          });
        }
        console.error("Caught persistence layer exception:", err);
      }
    }
  };

  const deleteCategory = async (uuid: string) => {
    if (!db) return;
    try {
      await db
        .update(categories)
        .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
        .where(eq(categories.uuid, uuid));
      await loadData();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const startEdit = (category: any) => {
    setEditingUuid(category.uuid);
    setFormData({
      name: category.name,
      parent_id: category.parent_id || "",
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({ name: "", parent_id: "" });
    setErrors({});
  };

  return {
    categoriesList: paginatedData,
    allCategories: categoriesList,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    updateField,
    handleSave,
    deleteCategory,
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
