"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { branches } from "../../../db/schemas/branches";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../hooks/useNotification";

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
  const { getTenantId } = useAuth();
  const { error } = useNotification();
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
    searchKeys: ["name", "city", "country", "email"],
  });

  useEffect(() => {
    getDatabase()
      .then(setDb)
      .catch(() => setLoading(false));
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.branches.findMany({
        where: (b: any, { isNull }: any) => isNull(b.deleted_at),
        orderBy: (b: any, { asc }: any) => asc(b.name),
      });
      setBranchesList(results);
    } catch (error) {
      console.error("Failed to load branches:", error);
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

    // 1. In-memory duplicate name check
    const isDuplicateName = branchesList.some(
      (b: any) =>
        (b?.name || "").trim().toLowerCase() === normalizedInputName &&
        b.uuid !== editingUuid,
    );

    if (isDuplicateName && normalizedInputName.length > 0) {
      setErrors({
        name: "A branch with this name already exists",
      });
      return;
    }

    // 2. In-memory multi-headquarters prevention check
    if (formData.is_main) {
      const hasExistingMainBranch = branchesList.some(
        (b: any) => b.is_main === true && b.uuid !== editingUuid,
      );

      if (hasExistingMainBranch) {
        // Trigger system sound and native application platform notification banner
        error(
          "You have already registered a main headquarters branch, please unregister the existing one first, then you can register a new main headquarters branch.",
        );

        setErrors({
          is_main: "A main headquarters branch already exists for this tenant",
        });
        return;
      }
    }

    try {
      const valid = await branchSchema.validate(formData, {
        abortEarly: false,
      });

      if (!db) return;

      const tenantId = getTenantId();

      if (editingUuid) {
        await db
          .update(branches)
          .set({
            ...valid,
            sync_status: "updated",
          })
          .where(eq(branches.uuid, editingUuid));
      } else {
        await db.insert(branches).values({
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
            name: "A branch with this name already exists",
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

  const deleteBranch = async (uuid: string) => {
    if (!db) return;
    try {
      await db
        .update(branches)
        .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
        .where(eq(branches.uuid, uuid));
      await loadData();
    } catch (error) {
      console.error("Failed to delete branch:", error);
    }
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
