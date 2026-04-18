"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import { products } from "../../../db/schemas/product";
import { eq } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";

const productSchema = yup.object({
  name: yup.string().required("Name is required"),
  sku: yup.string().required("SKU is required"),
  barcode: yup.string().nullable().default(""),
  description: yup.string().nullable().default(""),
  category_id: yup.string().nullable().default(""),
  brand_id: yup.string().nullable().default(""),
  uom: yup.string().required("Unit is required"),
  buying_price: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .default(0),
  selling_price: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .default(0),
  tax_rate: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .default(0),
  is_tax_inclusive: yup.boolean().default(true),
  current_stock: yup
    .number()
    .transform((v) => (isNaN(v) ? 0 : v))
    .default(0),
  minimum_stock_level: yup
    .number()
    .transform((v) => (isNaN(v) ? 5 : v))
    .default(5),
  is_active: yup.boolean().default(true),
  has_inventory: yup.boolean().default(true),
  metadata: yup.object().default({}),
});

export function useProductViewModel() {
  const [db, setDb] = useState<any>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState<any>({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category_id: "",
    brand_id: "",
    uom: "",
    buying_price: 0,
    selling_price: 0,
    tax_rate: 0,
    is_tax_inclusive: true,
    current_stock: 0,
    minimum_stock_level: 5,
    is_active: true,
    has_inventory: true,
    metadata: {},
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
    data: productsList,
    initialPageSize: 10,
    searchKeys: ["name", "sku", "barcode"],
  });

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  const loadData = async () => {
    if (!db) return;
    try {
      const [pRes, cRes, bRes, aRes, uRes] = await Promise.all([
        db.query.products.findMany({
          where: (p: any, { isNull }: any) => isNull(p.deleted_at),
        }),
        db.query.categories.findMany({
          where: (c: any, { isNull }: any) => isNull(c.deleted_at),
        }),
        db.query.brands.findMany({
          where: (b: any, { isNull }: any) => isNull(b.deleted_at),
        }),
        db.query.attributeDefinitions.findMany({
          where: (a: any, { isNull }: any) => isNull(a.deleted_at),
        }),
        db.query.units.findMany({
          where: (u: any, { eq }: any) => eq(u.is_active, true),
        }),
      ]);
      setProductsList(pRes);
      setCategoriesList(cRes);
      setBrandsList(bRes);
      setAttributes(aRes);
      setUnitsList(uRes);
    } finally {
      setLoading(false);
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

  const handleAttributeChange = (attributeUuid: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      metadata: { ...prev.metadata, [attributeUuid]: value },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const valid = await productSchema.validate(formData, {
        abortEarly: false,
      });

      // --- NEW: SKU Uniqueness Check ---
      const isSkuTaken = productsList.find(
        (p) =>
          p.sku?.toLowerCase() === valid.sku.toLowerCase() &&
          p.uuid !== editingUuid, // Exclude the current product if editing
      );

      if (isSkuTaken) {
        setErrors({ sku: "This SKU is already assigned to another product" });
        return; // Stop the save process
      }
      // ---------------------------------

      if (editingUuid) {
        await db
          .update(products)
          .set(valid)
          .where(eq(products.uuid, editingUuid));
      } else {
        await db.insert(products).values({
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

  const startEdit = (product: any) => {
    setEditingUuid(product.uuid);
    setFormData({
      ...product,
      barcode: product.barcode ?? "",
      description: product.description ?? "",
      category_id: product.category_id ?? "",
      brand_id: product.brand_id ?? "",
      uom: product.uom ?? "",
      tax_rate: product.tax_rate ?? 0,
      is_tax_inclusive: product.is_tax_inclusive ?? true,
      is_active: product.is_active ?? true,
      has_inventory: product.has_inventory ?? true,
      metadata: product.metadata || {},
    });
  };

  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      name: "",
      sku: "",
      barcode: "",
      description: "",
      category_id: "",
      brand_id: "",
      uom: "",
      buying_price: 0,
      selling_price: 0,
      tax_rate: 0,
      is_tax_inclusive: true,
      current_stock: 0,
      minimum_stock_level: 5,
      is_active: true,
      has_inventory: true,
      metadata: {},
    });
    setErrors({});
  };

  return {
    productsList: paginatedData,
    categoriesList,
    brandsList,
    unitsList,
    attributes,
    loading,
    editingUuid,
    errors,
    formData,
    setFormData,
    handleNumericChange,
    handleAttributeChange,
    handleSave,
    deleteProduct: async (uuid: string) => {
      await db
        .update(products)
        .set({ deleted_at: new Date().toISOString() })
        .where(eq(products.uuid, uuid));
      loadData();
    },
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
