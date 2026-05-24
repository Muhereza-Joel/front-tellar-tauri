"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { brands } from "../../../db/schemas/brand";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

// Auto-trim values and ensure whitespace-only triggers required validation
const brandSchema = yup.object({
  name: yup.string().trim().required("Brand name is required"),
  slug: yup
    .string()
    .trim()
    .required("Slug is required") // Put required first
    .matches(/^[a-z0-9-]+$/, {
      message: "Use lowercase, numbers, and hyphens only",
      excludeEmptyString: true, // <-- Crucial! Stops regex running on empty inputs
    }),
  description: yup
    .string()
    .trim()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

export function useBrandViewModel() {
  const { getTenantId } = useAuth();
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
    searchKeys: ["name", "slug", "description"],
  });

  useEffect(() => {
    getDatabase()
      .then(setDb)
      .catch(() => setLoading(false)); // Gracefully handle connection drops on load
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.brands.findMany({
        where: (b: any, { isNull }: any) => isNull(b.deleted_at),
        orderBy: (b: any, { asc }: any) => asc(b.name),
      });
      setBrandsList(results);
    } catch (error) {
      console.error("Failed to load brands database data:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    if (db) loadData();
  }, [db]);

  /**
   * Helper code to cleanly regenerate a slug matching rule requirements
   */
  const computeSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Strip symbols
      .replace(/[\s_-]+/g, "-") // Collapse spaces/hyphens to single hyphen
      .replace(/^-+|-+$/g, ""); // Trim flanking hyphens
  };

  /**
   * Universal change handler that updates input data, clears field-specific errors,
   * and automatically updates slugs when 'name' changes.
   */
  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Dynamic side effect: If user updates name, auto-generate the slug
      if (field === "name") {
        updated.slug = computeSlug(value);
      }
      return updated;
    });

    // Wipe error indicator dynamically as user resolves problems
    if (errors[field] || (field === "name" && errors["slug"])) {
      setErrors((prev: any) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        if (field === "name") delete nextErrors["slug"];
        return nextErrors;
      });
    }
  };

  // Deprecated backwards-compatible wrapper for name adjustments
  const handleNameChange = (name: string) => {
    updateField("name", name);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const valid = await brandSchema.validate(formData, { abortEarly: false });

      if (editingUuid) {
        await db
          .update(brands)
          .set({ ...valid, sync_status: "updated" })
          .where(eq(brands.uuid, editingUuid));
      } else {
        await db.insert(brands).values({
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

  const deleteBrand = async (uuid: string) => {
    if (!db) return;
    try {
      await db
        .update(brands)
        .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
        .where(eq(brands.uuid, uuid));
      await loadData();
    } catch (error) {
      console.error("Failed to delete brand:", error);
    }
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

  return {
    brandsList: paginatedData,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    updateField,
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
