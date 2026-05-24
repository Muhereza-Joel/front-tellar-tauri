"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { brands } from "../../../db/schemas/brand";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

const brandSchema = yup.object({
  name: yup.string().trim().required("Brand name is required"),
  slug: yup
    .string()
    .trim()
    .required("Slug is required")
    .matches(/^[a-z0-9-]+$/, {
      message: "Use lowercase, numbers, and hyphens only",
      excludeEmptyString: true,
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
    searchKeys: ["name", "slug"],
  });

  useEffect(() => {
    getDatabase()
      .then(setDb)
      .catch(() => setLoading(false));
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.brands.findMany({
        where: (b: any, { isNull }: any) => isNull(b.deleted_at),
        orderBy: (b: any, { asc }: any) => asc(b.name),
      });
      setBrandsList(results || []);
    } catch (error) {
      console.error("Failed to load brands database data:", error);
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
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // FIX 1: Use a functional state update callback to safely get the freshest previous state
    setFormData((prev) => ({
      ...prev,
      name,
      slug,
    }));

    setErrors((prev: any) => {
      const nextErrors = { ...prev };
      delete nextErrors.name;
      delete nextErrors.slug;
      return nextErrors;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const normalizedInputName = (formData.name || "").trim().toLowerCase();
    const normalizedInputSlug = (formData.slug || "").trim().toLowerCase();

    // FIX 2: Added optional chaining and safe string defaults to prevent crashes on mocked lists
    const isDuplicateName = brandsList.some(
      (b) =>
        (b?.name || "").trim().toLowerCase() === normalizedInputName &&
        b.uuid !== editingUuid,
    );
    if (isDuplicateName && normalizedInputName.length > 0) {
      setErrors({ name: "A brand with this name already exists" });
      return;
    }

    const isDuplicateSlug = brandsList.some(
      (b) =>
        (b?.slug || "").trim().toLowerCase() === normalizedInputSlug &&
        b.uuid !== editingUuid,
    );
    if (isDuplicateSlug && normalizedInputSlug.length > 0) {
      setErrors({ slug: "This URL slug is already taken" });
      return;
    }

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
      } else {
        const errorMessage = String(err?.message || err);
        if (errorMessage.includes("UNIQUE") || errorMessage.includes("2067")) {
          if (errorMessage.includes("slug")) {
            setErrors({ slug: "This URL slug is already taken" });
          } else {
            setErrors({ name: "A brand with this name already exists" });
          }
        } else {
          setErrors({
            submit: "An unexpected storage error occurred. Please try again.",
          });
        }
        console.error("Caught persistence layer exception:", err);
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
    allBrands: brandsList,
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
