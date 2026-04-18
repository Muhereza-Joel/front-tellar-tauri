"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { attributeDefinitions } from "../../../db/schemas/attribute_definitions";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";

const attributeSchema = yup.object({
  label: yup.string().required("Label is required"),
  fieldType: yup
    .string()
    .oneOf(["text", "number", "date", "select"])
    .required(),
  isRequired: yup.boolean().default(false),
  placeholder: yup.string().nullable(),
  options: yup
    .array()
    .of(yup.string())
    .nullable()
    .when("fieldType", {
      is: "select",
      then: (schema) => schema.min(1, "At least one option is required"),
      otherwise: (schema) => schema.nullable(),
    }),
});

export function useAttributeViewModel() {
  const [db, setDb] = useState<any>(null);
  const [attributesList, setAttributesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [optionInput, setOptionInput] = useState("");

  const [formData, setFormData] = useState({
    label: "",
    fieldType: "text",
    isRequired: false,
    placeholder: "",
    options: [] as string[],
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
    data: attributesList,
    initialPageSize: 10,
    searchKeys: ["label", "fieldType"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.attributeDefinitions.findMany({
        where: (ad: any, { isNull }: any) => isNull(ad.deleted_at),
        orderBy: (ad: any, { asc }: any) => asc(ad.label),
      });
      setAttributesList(results);
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
      const valid = await attributeSchema.validate(formData, {
        abortEarly: false,
      });
      if (editingUuid) {
        await db
          .update(attributeDefinitions)
          .set(valid)
          .where(eq(attributeDefinitions.uuid, editingUuid));
      } else {
        await db.insert(attributeDefinitions).values({
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

  const addOption = () => {
    if (optionInput.trim() && !formData.options.includes(optionInput.trim())) {
      setFormData({
        ...formData,
        options: [...formData.options, optionInput.trim()],
      });
      setOptionInput("");
    }
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const deleteAttribute = async (uuid: string) => {
    if (!db) return;
    await db
      .update(attributeDefinitions)
      .set({ deleted_at: new Date().toISOString() })
      .where(eq(attributeDefinitions.uuid, uuid));
    loadData();
  };

  const startEdit = (attr: any) => {
    setEditingUuid(attr.uuid);
    setFormData({
      label: attr.label,
      fieldType: attr.fieldType,
      isRequired: attr.isRequired,
      placeholder: attr.placeholder || "",
      options: attr.options || [],
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      label: "",
      fieldType: "text",
      isRequired: false,
      placeholder: "",
      options: [],
    });
    setErrors({});
  };

  return {
    attributesList: paginatedData,
    loading,
    editingUuid,
    errors,
    formData,
    optionInput,
    setOptionInput,
    addOption,
    removeOption,
    setFormData,
    handleSave,
    deleteAttribute,
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
