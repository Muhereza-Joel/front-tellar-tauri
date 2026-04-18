"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getDatabase } from "../../../db";
import { productVariants } from "../../../db/schemas/product_variants";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";

const variantSchema = yup.object({
  product_id: yup.string().required("Select a base product"),
  sku: yup.string().required("SKU is required"),
  selling_price: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .min(0)
    .default(0),
  current_stock: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .min(0)
    .default(0),
  minimum_stock_level: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .min(0)
    .default(2),
  attribute_type: yup.string().required("Required"),
  attribute_value: yup.string().required("Required"),
});

export function useProductVariantViewModel() {
  const [db, setDb] = useState<any>(null);
  const [variantsList, setVariantsList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    product_id: "",
    sku: "",
    selling_price: "0",
    current_stock: "0",
    minimum_stock_level: "2",
    attribute_type: "",
    attribute_value: "",
  });

  // Pagination Logic mirroring useProductViewModel
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
    searchKeys: ["sku", "attribute_type", "attribute_value"],
  });

  const unit = useMemo(() => {
    const parentProduct = productsList.find(
      (p) => p.uuid === formData.product_id,
    );
    if (!parentProduct || !parentProduct.uom)
      return { singular: "unit", plural: "units" };

    const unitRecord = unitsList.find((u) => u.uuid === parentProduct.uom);
    return {
      singular: unitRecord?.singular?.toLowerCase() || "unit",
      plural: unitRecord?.plural?.toLowerCase() || "units",
    };
  }, [formData.product_id, productsList, unitsList]);

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = useCallback(async () => {
    if (!db) return;
    const [vRes, pRes, uRes] = await Promise.all([
      db.query.productVariants.findMany({
        where: (pv: any, { isNull }: any) => isNull(pv.deleted_at),
        orderBy: (pv: any, { desc }: any) => desc(pv.created_at),
      }),
      db.query.products.findMany({
        where: (p: any, { isNull }: any) => isNull(p.deleted_at),
      }),
      db.query.units.findMany(),
    ]);
    setVariantsList(vRes || []);
    setProductsList(pRes || []);
    setUnitsList(uRes || []);
  }, [db]);

  useEffect(() => {
    if (db) loadData();
  }, [db, loadData]);

  const handleProductChange = (productId: string) => {
    const parent = productsList.find((p) => p.uuid === productId);
    setFormData((prev) => ({
      ...prev,
      product_id: productId,
      sku: parent ? `${parent.sku}-` : "",
      selling_price: String(parent?.selling_price || 0),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFormErrors({});
    try {
      const valid = await variantSchema.validate(formData, {
        abortEarly: false,
      });
      const now = new Date().toISOString();
      if (editingUuid) {
        await db
          .update(productVariants)
          .set({ ...valid, updated_at: now })
          .where(eq(productVariants.uuid, editingUuid));
      } else {
        await db.insert(productVariants).values({
          uuid: uuidv7(),
          ...valid,
          created_at: now,
          updated_at: now,
        });
      }
      resetForm();
      await loadData();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) errors[e.path] = e.message;
        });
        setFormErrors(errors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormErrors({});
    setFormData({
      product_id: "",
      sku: "",
      selling_price: "0",
      current_stock: "0",
      minimum_stock_level: "2",
      attribute_type: "",
      attribute_value: "",
    });
  };

  return {
    variantsList: paginatedData,
    productsList,
    unitsList,
    isSaving,
    editingUuid,
    formData,
    setFormData,
    formErrors,
    unit,
    handleProductChange,
    handleSave,
    resetForm,
    startEdit: (v: any) => {
      setEditingUuid(v.uuid);
      setFormData({
        ...v,
        selling_price: String(v.selling_price),
        current_stock: String(v.current_stock),
        minimum_stock_level: String(v.minimum_stock_level),
      });
    },
    deleteVariant: async (id: string) => {
      await db
        .update(productVariants)
        .set({ deleted_at: new Date().toISOString() })
        .where(eq(productVariants.uuid, id));
      await loadData();
    },
    // Exporting Pagination State
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
