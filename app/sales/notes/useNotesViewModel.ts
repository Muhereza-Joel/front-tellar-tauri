"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { notes } from "../../../db/schemas/notes";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

const noteSchema = yup.object({
  title: yup.string().required("A brief subject title is required"),
  category: yup
    .string()
    .oneOf(["VEHICLE", "CUSTOMER", "SERVICE", "GENERAL"])
    .required("Category is required"),
  content: yup.string().required("Note logs cannot be submitted empty"),
  referenceId: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  isActive: yup.boolean().default(true),
});

export function useNotesViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [rawNotesList, setRawNotesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    category: "GENERAL" as "VEHICLE" | "CUSTOMER" | "SERVICE" | "GENERAL",
    content: "",
    referenceId: "",
    isActive: true,
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
    data: rawNotesList,
    initialPageSize: 10,
    searchKeys: ["title", "category", "content", "referenceId"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.notes.findMany({
        where: (n: any, { isNull }: any) => isNull(n.deleted_at),
        orderBy: (n: any, { desc }: any) => desc(n.created_at),
      });
      setRawNotesList(results);
    } catch (err) {
      console.error("Failed loading local sqlite notes records:", err);
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
      const valid = await noteSchema.validate(formData, { abortEarly: false });

      if (editingUuid) {
        await db
          .update(notes)
          .set({
            title: valid.title,
            category: valid.category,
            content: valid.content,
            referenceId: valid.referenceId,
            isActive: valid.isActive,
            sync_status: "updated",
            updated_at: new Date().toISOString(),
          })
          .where(eq(notes.uuid, editingUuid));
      } else {
        await db.insert(notes).values({
          uuid: uuidv7(),
          tenantId: getTenantId(),
          title: valid.title,
          category: valid.category,
          content: valid.content,
          referenceId: valid.referenceId,
          isActive: valid.isActive,
          sync_status: "created",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

  const deleteNote = async (uuid: string) => {
    if (!db) return;
    try {
      await db
        .update(notes)
        .set({
          deleted_at: new Date().toISOString(),
          sync_status: "deleted",
        })
        .where(eq(notes.uuid, uuid));
      loadData();
    } catch (err) {
      console.error("Failed marking note entry as deleted:", err);
    }
  };

  const startEdit = (note: any) => {
    setEditingUuid(note.uuid);
    setFormData({
      title: note.title,
      category: note.category,
      content: note.content,
      referenceId: note.referenceId || "",
      isActive: Boolean(note.isActive),
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      title: "",
      category: "GENERAL",
      content: "",
      referenceId: "",
      isActive: true,
    });
    setErrors({});
  };

  return {
    notesList: paginatedData,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleSave,
    deleteNote,
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
