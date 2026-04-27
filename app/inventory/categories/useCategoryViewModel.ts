"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { categories } from "../../../db/schemas/category"; // Adjust path to your schema
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

const categorySchema = yup.object({
  name: yup.string().required("Category name is required"),
  parent_id: yup
    .string()
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
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.categories.findMany({
        where: (cat: any, { isNull }: any) => isNull(cat.deleted_at),
        orderBy: (cat: any, { asc }: any) => asc(cat.name),
      });
      setCategoriesList(results);
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

  const deleteCategory = async (uuid: string) => {
    if (!db) return;
    await db
      .update(categories)
      .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
      .where(eq(categories.uuid, uuid));
    loadData();
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
    allCategories: categoriesList, // Useful for the parent dropdown
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
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
