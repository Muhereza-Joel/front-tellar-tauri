"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { discounts } from "../../../db/schemas/discounts"; // Adjust the path as required
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

const discountSchema = yup.object({
  name: yup.string().required("Discount campaign name is required"),
  type: yup
    .string()
    .oneOf(["PERCENTAGE", "FIXED"])
    .required("Yield strategy type is required"),
  value: yup
    .number()
    .typeError("Value must be a valid number")
    .positive("Please enter a value greater than 0")
    .required("Value scalar configuration is required")
    .test(
      "percentage-cap",
      "Percentage value cannot exceed 100%",
      function (val) {
        const { type } = this.parent;
        if (type === "PERCENTAGE" && val > 100) return false;
        return true;
      },
    ),
  startDate: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  endDate: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  isActive: yup.boolean().default(true),
});

export function useDiscountsViewModel() {
  const { getTenantId } = useAuth(); // Assuming getBranchId is also available if needed
  const [db, setDb] = useState<any>(null);
  const [rawDiscountsList, setRawDiscountsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: "",
    startDate: "",
    endDate: "",
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
    data: rawDiscountsList,
    initialPageSize: 10,
    searchKeys: ["name", "type"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const results = await db.query.discounts.findMany({
        where: (d: any, { isNull }: any) => isNull(d.deleted_at),
        orderBy: (d: any, { desc }: any) => desc(d.created_at),
      });
      setRawDiscountsList(results);
    } catch (err) {
      console.error("Failed loading local sqlite discounts:", err);
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
      const valid = await discountSchema.validate(
        {
          ...formData,
          value: formData.value === "" ? undefined : Number(formData.value),
        },
        { abortEarly: false },
      );

      if (editingUuid) {
        await db
          .update(discounts)
          .set({
            name: valid.name,
            type: valid.type,
            value: valid.value,
            startDate: valid.startDate,
            endDate: valid.endDate,
            isActive: valid.isActive,
            sync_status: "updated",
            updated_at: new Date().toISOString(),
          })
          .where(eq(discounts.uuid, editingUuid));
      } else {
        await db.insert(discounts).values({
          uuid: uuidv7(),
          tenantId: getTenantId(),
          name: valid.name,
          type: valid.type,
          value: valid.value,
          startDate: valid.startDate,
          endDate: valid.endDate,
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

  const toggleDiscountState = async (
    uuid: string,
    currentIsActive: boolean,
  ) => {
    if (!db) return;
    try {
      await db
        .update(discounts)
        .set({
          isActive: !currentIsActive,
          sync_status: "updated",
          updated_at: new Date().toISOString(),
        })
        .where(eq(discounts.uuid, uuid));
      loadData();
    } catch (err) {
      console.error(
        "Failed executing local criteria state transformation:",
        err,
      );
    }
  };

  const deleteDiscount = async (uuid: string) => {
    if (!db) return;
    try {
      await db
        .update(discounts)
        .set({
          deleted_at: new Date().toISOString(),
          sync_status: "deleted",
        })
        .where(eq(discounts.uuid, uuid));
      loadData();
    } catch (err) {
      console.error("Failed tracking record deletion marker:", err);
    }
  };

  const startEdit = (discount: any) => {
    setEditingUuid(discount.uuid);
    setFormData({
      name: discount.name,
      type: discount.type,
      value: String(discount.value),
      startDate: discount.startDate || "",
      endDate: discount.endDate || "",
      isActive: Boolean(discount.isActive),
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      name: "",
      type: "PERCENTAGE",
      value: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
    setErrors({});
  };

  return {
    discountsList: paginatedData,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleSave,
    deleteDiscount,
    toggleDiscountState,
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
