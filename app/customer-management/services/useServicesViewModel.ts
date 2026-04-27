"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { services } from "../../../db/schemas/services";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

const serviceSchema = yup.object({
  name: yup.string().required("Service name is required"),
  description: yup.string().nullable(),
  category_id: yup.string().nullable(),
  brand_id: yup.string().nullable(),
  base_price: yup.number().min(0).default(0),
  tax_rate: yup.number().min(0).default(0),
  is_tax_inclusive: yup.boolean().default(true),
  duration_minutes: yup.number().nullable(),
  requires_appointment: yup.boolean().default(true),
  max_bookings_per_slot: yup.number().integer().min(1).default(1),
  is_rental: yup.boolean().default(false),
  deposit_required: yup.number().when("is_rental", {
    is: true,
    then: (schema) => schema.min(0).required(),
    otherwise: (schema) => schema.nullable(),
  }),
  rental_rate_unit: yup.string().nullable(),
  late_fee_per_unit: yup.number().min(0).default(0),
  availability_schedule: yup.mixed().nullable(),
  metadata: yup.mixed().nullable(),
  is_active: yup.boolean().default(true),
});

export function useServicesViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category_id: string;
    brand_id: string;
    base_price: number;
    tax_rate: number;
    is_tax_inclusive: boolean;
    duration_minutes: number;
    requires_appointment: boolean;
    max_bookings_per_slot: number;
    is_rental: boolean;
    deposit_required: number;
    rental_rate_unit: string;
    late_fee_per_unit: number;
    availability_schedule: Record<string, string[]>;
    metadata: Record<string, any>;
    is_active: boolean;
  }>({
    name: "",
    description: "",
    category_id: "",
    brand_id: "",
    base_price: 0,
    tax_rate: 0,
    is_tax_inclusive: true,
    duration_minutes: 30,
    requires_appointment: true,
    max_bookings_per_slot: 1,
    is_rental: false,
    deposit_required: 0,
    rental_rate_unit: "hour",
    late_fee_per_unit: 0,
    availability_schedule: { monday: ["09:00-17:00"] } as Record<
      string,
      string[]
    >,
    metadata: {},
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
    data: servicesList,
    initialPageSize: 10,
    searchKeys: [
      "name",
      "description",
      "rental_rate_unit",
      "category_id",
      "brand_id",
    ],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const [servicesResult, categoriesResult, brandsResult] =
        await Promise.all([
          db.query.services.findMany({
            where: (s: any, { isNull }: any) => isNull(s.deleted_at),
            orderBy: (s: any, { desc }: any) => desc(s.created_at),
          }),
          db.query.categories.findMany({
            where: (c: any, { isNull }: any) => isNull(c.deleted_at),
          }),
          db.query.brands.findMany({
            where: (b: any, { isNull }: any) => isNull(b.deleted_at),
          }),
        ]);
      setServicesList(servicesResult);
      setCategoriesList(categoriesResult);
      setBrandsList(brandsResult);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    if (db) loadData();
  }, [db]);

  const handleNumericChange = (field: string, value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "");
    setFormData((prev: any) => ({
      ...prev,
      [field]: cleanValue === "" ? 0 : parseFloat(cleanValue),
    }));
  };

  const formatDisplay = (val: number) => {
    if (!val && val !== 0) return "";
    return val.toLocaleString("en-US");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const valid = await serviceSchema.validate(formData, {
        abortEarly: false,
      });

      const payload = {
        ...valid,
        availability_schedule: formData.availability_schedule || null,
        metadata: formData.metadata || {},
      };

      if (editingUuid) {
        await db
          .update(services)
          .set({
            ...payload,
            updated_at: new Date().toISOString(),
            sync_status: "updated",
          })
          .where(eq(services.uuid, editingUuid));
      } else {
        await db
          .insert(services)
          .values({
            uuid: uuidv7(),
            ...payload,
            tenant_id: getTenantId(),
            sync_status: "created",
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
      } else {
        console.error("Save error:", err);
      }
    }
  };

  const deleteService = async (uuid: string) => {
    if (!db) return;
    await db
      .update(services)
      .set({ deleted_at: new Date().toISOString() })
      .where(eq(services.uuid, uuid));
    loadData();
  };

  const startEdit = (service: any) => {
    setEditingUuid(service.uuid);
    setFormData({
      name: service.name || "",
      description: service.description || "",
      category_id: service.category_id || "",
      brand_id: service.brand_id || "",
      base_price: service.base_price || 0,
      tax_rate: service.tax_rate || 0,
      is_tax_inclusive: service.is_tax_inclusive ?? true,
      duration_minutes: service.duration_minutes || 30,
      requires_appointment: service.requires_appointment ?? true,
      max_bookings_per_slot: service.max_bookings_per_slot || 1,
      is_rental: service.is_rental || false,
      deposit_required: service.deposit_required || 0,
      rental_rate_unit: service.rental_rate_unit || "hour",
      late_fee_per_unit: service.late_fee_per_unit || 0,
      availability_schedule: service.availability_schedule || {
        monday: ["09:00-17:00"],
      },
      metadata: service.metadata || {},
      is_active: service.is_active ?? true,
    });
    setErrors({});
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      name: "",
      description: "",
      category_id: "",
      brand_id: "",
      base_price: 0,
      tax_rate: 0,
      is_tax_inclusive: true,
      duration_minutes: 30,
      requires_appointment: true,
      max_bookings_per_slot: 1,
      is_rental: false,
      deposit_required: 0,
      rental_rate_unit: "hour",
      late_fee_per_unit: 0,
      availability_schedule: { monday: ["09:00-17:00"] },
      metadata: {},
      is_active: true,
    });
    setErrors({});
  };

  return {
    servicesList: paginatedData,
    categoriesList,
    brandsList,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleSave,
    formatDisplay,
    handleNumericChange,
    deleteService,
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
