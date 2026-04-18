"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { brands } from "../../../db/schemas/brand";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";

const brandSchema = yup.object({
  name: yup.string().required("Brand name is required"),
  slug: yup
    .string()
    .required("Slug is required")
    .matches(/^[a-z0-9-]+$/, "Use lowercase, numbers, and hyphens only"),
  description: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

export function useBrandViewModel() {
  const [db, setDb] = useState<any>(null);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
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
    data: brandsList,
    initialPageSize: 10,
    searchKeys: ["name", "slug"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.brands.findMany({
        where: (b: any, { isNull }: any) => isNull(b.deleted_at),
        orderBy: (b: any, { asc }: any) => asc(b.name),
      });
      setBrandsList(results);
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
      const valid = await brandSchema.validate(formData, { abortEarly: false });

      if (editingUuid) {
        await db.update(brands).set(valid).where(eq(brands.uuid, editingUuid));
      } else {
        await db.insert(brands).values({
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

  const deleteBrand = async (uuid: string) => {
    if (!db) return;
    await db
      .update(brands)
      .set({ deleted_at: new Date().toISOString() })
      .where(eq(brands.uuid, uuid));
    loadData();
  };

  const startEdit = (brand: any) => {
    setEditingUuid(brand.uuid);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({ name: "", slug: "", description: "" });
    setErrors({});
  };

  /**
   * UPDATED: Regenerates slug on every name change,
   * regardless of whether creating or editing.
   */
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData({ ...formData, name, slug });
  };

  return {
    brandsList: paginatedData,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleNameChange,
    handleSave,
    deleteBrand,
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
