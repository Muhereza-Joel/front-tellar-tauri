"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { serviceVariants } from "../../../db/schemas/service_variants";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";

const variantSchema = yup.object({
  name: yup.string().required("Variant name is required"),
  service_id: yup.string().required("Service is required"),
  sku: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  description: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  price_adjustment: yup.number().typeError("Must be a number").default(0),
  absolute_price: yup.number().nullable().typeError("Must be a number"),
  duration_minutes: yup.number().nullable().typeError("Must be a number"),
  deposit_required: yup.number().nullable().typeError("Must be a number"),
  rental_rate_unit: yup.string().nullable(),
  late_fee_per_unit: yup.number().nullable().typeError("Must be a number"),
  available_quantity: yup.number().default(0),
  minimum_stock_level: yup.number().default(0),
  is_active: yup.boolean().default(true),
});

export function useServiceVariantViewModel() {
  const [db, setDb] = useState<any>(null);
  const [variantsList, setVariantsList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    name: "",
    service_id: "",
    sku: "",
    description: "",
    price_adjustment: 0,
    absolute_price: "",
    duration_minutes: "",
    deposit_required: "",
    rental_rate_unit: "hour",
    late_fee_per_unit: "",
    available_quantity: 0,
    minimum_stock_level: 0,
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
    data: variantsList,
    initialPageSize: 10,
    searchKeys: ["name", "sku", "description", "service_id"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const [variantsResult, servicesResult] = await Promise.all([
        db.query.serviceVariants.findMany({
          where: (sv: any, { isNull }: any) => isNull(sv.deleted_at),
          orderBy: (sv: any, { desc }: any) => desc(sv.created_at),
        }),
        db.query.services.findMany({
          where: (s: any, { isNull }: any) => isNull(s.deleted_at),
          columns: { uuid: true, name: true },
        }),
      ]);
      setVariantsList(variantsResult);
      setServicesList(servicesResult);
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
      const valid = await variantSchema.validate(formData, {
        abortEarly: false,
      });

      const payload = {
        ...valid,
        absolute_price: valid.absolute_price
          ? Number(valid.absolute_price)
          : null,
        duration_minutes: valid.duration_minutes
          ? Number(valid.duration_minutes)
          : null,
        deposit_required: valid.deposit_required
          ? Number(valid.deposit_required)
          : null,
        late_fee_per_unit: valid.late_fee_per_unit
          ? Number(valid.late_fee_per_unit)
          : null,
        rental_rate_unit: valid.rental_rate_unit || null,
      };

      if (editingUuid) {
        await db
          .update(serviceVariants)
          .set(payload)
          .where(eq(serviceVariants.uuid, editingUuid));
      } else {
        await db.insert(serviceVariants).values({
          uuid: uuidv7(),
          ...payload,
          created_at: new Date().toISOString(),
        });
      }

      resetForm();
      loadData();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const mappedErrors: Record<string, string> = {};
        err.inner.forEach((e: any) => {
          if (e.path) mappedErrors[e.path] = e.message;
        });
        setErrors(mappedErrors);
      }
    }
  };

  const deleteVariant = async (uuid: string) => {
    if (!db) return;
    await db
      .update(serviceVariants)
      .set({ deleted_at: new Date().toISOString() })
      .where(eq(serviceVariants.uuid, uuid));
    loadData();
  };

  const startEdit = (variant: any) => {
    setEditingUuid(variant.uuid);
    setFormData({
      name: variant.name || "",
      service_id: variant.service_id || "",
      sku: variant.sku || "",
      description: variant.description || "",
      price_adjustment: variant.price_adjustment ?? 0,
      absolute_price: variant.absolute_price?.toString() || "",
      duration_minutes: variant.duration_minutes?.toString() || "",
      deposit_required: variant.deposit_required?.toString() || "",
      rental_rate_unit: variant.rental_rate_unit || "hour",
      late_fee_per_unit: variant.late_fee_per_unit?.toString() || "",
      available_quantity: variant.available_quantity ?? 0,
      minimum_stock_level: variant.minimum_stock_level ?? 0,
      is_active: variant.is_active ?? true,
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      name: "",
      service_id: "",
      sku: "",
      description: "",
      price_adjustment: 0,
      absolute_price: "",
      duration_minutes: "",
      deposit_required: "",
      rental_rate_unit: "hour",
      late_fee_per_unit: "",
      available_quantity: 0,
      minimum_stock_level: 0,
      is_active: true,
    });
    setErrors({});
  };

  return {
    variantsList: paginatedData,
    servicesList,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleSave,
    deleteVariant,
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
