"use client";

import { useEffect, useState, useMemo } from "react";
import { getDatabase } from "../../../db";
import {
  purchaseOrders,
  purchaseOrderItems,
  type PurchaseOrder,
  type PurchaseOrderItem,
} from "../../../db/schemas/purchase_orders";
import { type Product } from "../../../db/schemas/product";
import { type Supplier } from "../../../db/schemas/suppliers";
import { eq, sql, isNull, desc, SQLWrapper, AnyColumn } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePagination } from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";

// Validation schema for Purchase Order header
const purchaseOrderSchema = yup.object({
  po_number: yup.string().required("PO Number is required"),
  vendor_uuid: yup.string().required("Supplier is required"),
  vendor_name: yup.string().required("Supplier name is required"),
  issue_date: yup.string().required("Issue date is required"),
  expected_delivery_date: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  status: yup
    .string()
    .oneOf(["DRAFT", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"])
    .default("DRAFT"),
  notes: yup
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

// Validation schema for line items - using snake_case to match state
const purchaseOrderItemSchema = yup.object({
  product_uuid: yup.string().required("Product is required"),
  product_name: yup.string().required("Product name is required"),
  quantity: yup.number().min(1, "Quantity must be at least 1").required(),
  unit_price: yup.number().min(0, "Price must be 0 or greater").required(),
});

export function usePurchaseOrderViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data lists
  const [poList, setPoList] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    po_number: "",
    vendor_uuid: "",
    vendor_name: "",
    issue_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    status: "DRAFT",
    notes: "",
  });

  // Line items state
  const [items, setItems] = useState<Partial<PurchaseOrderItem>[]>([
    {
      uuid: uuidv7(),
      product_uuid: "",
      product_name: "",
      sku: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    },
  ]);

  // Product search state for each item row
  const [productSearch, setProductSearch] = useState<Record<string, string>>(
    {},
  );
  const [productSuggestions, setProductSuggestions] = useState<
    Record<string, Product[]>
  >({});
  const [showProductDropdown, setShowProductDropdown] = useState<
    Record<string, boolean>
  >({});

  // Pagination for list view
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
    data: poList,
    initialPageSize: 10,
    searchKeys: ["po_number", "vendor_name", "status"],
  });

  // Totals calculation - NO TAX
  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0,
    );
    return { subtotal, tax: 0, total: subtotal };
  }, [items]);

  // Initialize database
  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  // Load data when db is ready
  useEffect(() => {
    if (db) {
      loadPurchaseOrders();
      loadSuppliers();
    }
  }, [db]);

  // Load purchase orders
  const loadPurchaseOrders = async () => {
    if (!db) return;

    try {
      const results = await db.query.purchaseOrders.findMany({
        where: (po: { deleted_at: SQLWrapper }) => isNull(po.deleted_at),
        orderBy: (po: { created_at: SQLWrapper | AnyColumn }) => [
          desc(po.created_at),
        ],
      });

      setPoList(results);
    } catch (error) {
      console.error("Error loading POs:", error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  // Load suppliers for dropdown
  const loadSuppliers = async () => {
    if (!db) return;
    try {
      const results = await db.query.suppliers.findMany({
        where: (s: any, { and, eq }: any) =>
          and(eq(s.is_active, true), sql`${s.deleted_at} IS NULL`),
        orderBy: (s: any, { asc }: any) => asc(s.name),
      });
      setSuppliers(results);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  // Search products for autocomplete
  const searchProducts = async (searchTerm: string, itemUuid: string) => {
    if (!db || !searchTerm || searchTerm.length < 2) {
      setProductSuggestions((prev) => ({ ...prev, [itemUuid]: [] }));
      return;
    }

    try {
      const results = await db.query.products.findMany({
        where: (p: any, { and, eq, like }: any) =>
          and(
            eq(p.is_active, true),
            sql`${p.deleted_at} IS NULL`,
            like(p.name, `%${searchTerm}%`),
          ),
        limit: 10,
      });
      setProductSuggestions((prev) => ({ ...prev, [itemUuid]: results }));
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  // Clear product search for a row
  const clearProductSearch = (itemUuid: string) => {
    setProductSearch((prev) => ({ ...prev, [itemUuid]: "" }));
    setProductSuggestions((prev) => ({ ...prev, [itemUuid]: [] }));
    setShowProductDropdown((prev) => ({ ...prev, [itemUuid]: false }));
    updateItem(itemUuid, "product_uuid", "");
    updateItem(itemUuid, "product_name", "");
    updateItem(itemUuid, "sku", "");
  };

  // Load purchase order for editing
  const loadPurchaseOrderForEdit = async (uuid: string) => {
    if (!db) return;
    setLoading(true);
    try {
      // Load header
      const po = await db.query.purchaseOrders.findFirst({
        where: (po: any, { eq }: any) => eq(po.uuid, uuid),
      });

      if (!po) throw new Error("PO not found");

      const rawData = po.uuid;

      setFormData({
        po_number: rawData[1] ?? "",
        vendor_uuid: rawData[2] ?? "",
        vendor_name: rawData[3] ?? "",
        issue_date: rawData[5] ?? "",
        expected_delivery_date: rawData[6] ?? "",
        status: rawData[4] ?? "",
        notes: rawData[10] ?? "",
      });

      // Load line items
      const poItems = await db.query.purchaseOrderItems.findMany({
        where: (item: any, { eq }: any) => eq(item.purchase_order_uuid, uuid),
      });

      if (poItems && poItems.length > 0) {
        setItems(poItems.map((item: any) => ({ ...item, uuid: item.uuid })));
        // Initialize product search for each item
        const searchState: Record<string, string> = {};
        poItems.forEach((item: any) => {
          searchState[item.uuid] = item.product_name;
        });
        setProductSearch(searchState);
      } else {
        resetItems();
      }
    } catch (error) {
      console.error("Error loading PO for edit:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update line item field with auto total calculation
  const updateItem = (
    uuid: string,
    field: keyof PurchaseOrderItem,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.uuid === uuid) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unit_price") {
            updated.total_price =
              (updated.quantity || 0) * (updated.unit_price || 0);
          }
          return updated;
        }
        return item;
      }),
    );
  };

  // Add new empty line item
  const addItem = () => {
    setItems([
      ...items,
      {
        uuid: uuidv7(),
        product_uuid: "",
        product_name: "",
        sku: "",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  // Remove line item (minimum 1)
  const removeItem = (uuid: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((i) => i.uuid !== uuid));
      // Clean up search state
      setProductSearch((prev) => {
        const newState = { ...prev };
        delete newState[uuid];
        return newState;
      });
      setProductSuggestions((prev) => {
        const newState = { ...prev };
        delete newState[uuid];
        return newState;
      });
    }
  };

  // Reset items to single empty row
  const resetItems = () => {
    setItems([
      {
        uuid: uuidv7(),
        product_uuid: "",
        product_name: "",
        sku: "",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
    setProductSearch({});
    setProductSuggestions({});
    setShowProductDropdown({});
  };

  // Save purchase order (create or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      // Validate header
      await purchaseOrderSchema.validate(formData, { abortEarly: false });

      // Validate items (at least one non-empty item)
      const validItems = items.filter(
        (item) => item.product_name && item.product_name.trim() !== "",
      );
      if (validItems.length === 0) {
        setErrors({ items: "At least one line item is required" });
        setSaving(false);
        return;
      }

      // Validate each item with updated schema
      for (const item of validItems) {
        await purchaseOrderItemSchema.validate(item, { abortEarly: false });
      }

      const now = new Date().toISOString();

      if (editingUuid) {
        // UPDATE existing PO
        await db
          .update(purchaseOrders)
          .set({
            vendor_uuid: formData.vendor_uuid, // Ensure snake_case matches your DB
            vendor_name: formData.vendor_name,
            status: formData.status,
            issue_date: formData.issue_date,
            expected_delivery_date: formData.expected_delivery_date || null,

            // FIX: Ensure both subtotal and total_amount are updated
            subtotal: totals.subtotal,
            tax_amount: 0,
            total_amount: totals.total, // Use totals.total from your useMemo
            sync_status: "updated",
            notes: formData.notes || null,
            updated_at: now,
          })
          .where(eq(purchaseOrders.uuid, editingUuid));

        // Delete old items
        await db
          .update(purchaseOrderItems)
          .set({
            sync_status: "deleted",
            updated_at: now,
            deleted_at: new Date().toISOString(),
          })
          .where(eq(purchaseOrderItems.purchase_order_uuid, editingUuid));

        // Insert new items
        for (const item of validItems) {
          await db.insert(purchaseOrderItems).values({
            uuid: uuidv7(),
            purchase_order_uuid: editingUuid,
            product_uuid: item.product_uuid,
            product_name: item.product_name,
            sku: item.sku || "",
            quantity: item.quantity,
            received_quantity: 0,
            unit_price: item.unit_price,
            // Ensure total_price per line item is also calculated
            sync_status: "created",
            total_price: (item.quantity || 0) * (item.unit_price || 0),
            created_at: now,
            updated_at: now,
          });
        }
      } else {
        // CREATE new PO - tax_amount set to 0
        const poUuid = uuidv7();
        await db.insert(purchaseOrders).values({
          uuid: poUuid,
          po_number: formData.po_number,
          vendor_uuid: formData.vendor_uuid,
          vendor_name: formData.vendor_name,
          status: formData.status,
          issue_date: formData.issue_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          subtotal: totals.subtotal,
          tax_amount: 0,
          total_amount: totals.subtotal,
          notes: formData.notes || null,
          sync_status: "created",
          tenant_id: getTenantId(),
          created_at: now,
          updated_at: now,
        });

        for (const item of validItems) {
          await db.insert(purchaseOrderItems).values({
            uuid: uuidv7(),
            purchase_order_uuid: poUuid,
            product_uuid: item.product_uuid,
            product_name: item.product_name,
            sku: item.sku || "",
            quantity: item.quantity,
            received_quantity: 0,
            unit_price: item.unit_price,
            total_price: (item.quantity || 0) * (item.unit_price || 0),
            sync_status: "created",
            tenant_id: getTenantId(),
            created_at: now,
            updated_at: now,
          });
        }
      }

      resetForm();
      await loadPurchaseOrders();
      setView("list");
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const mappedErrors: Record<string, string> = {};
        err.inner.forEach((e: any) => {
          if (e.path) mappedErrors[e.path] = e.message;
        });
        setErrors(mappedErrors);
      } else {
        console.error("Error saving PO:", err);
        setErrors({ general: "Failed to save purchase order" });
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete purchase order (soft delete)
  const deletePurchaseOrder = async (uuid: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to delete this purchase order?"))
      return;

    try {
      await db
        .update(purchaseOrders)
        .set({ deleted_at: new Date().toISOString(), sync_status: "deleted" })
        .where(eq(purchaseOrders.uuid, uuid));
      await loadPurchaseOrders();
    } catch (error) {
      console.error("Error deleting PO:", error);
      alert("Failed to delete purchase order");
    }
  };

  // Start editing an existing PO
  const startEdit = (uuid: string) => {
    setEditingUuid(uuid);
    setView("form");
    loadPurchaseOrderForEdit(uuid);
  };

  // Create new PO
  const handleCreateNew = () => {
    resetForm();
    // Generate PO number: PO-YYYY-XXX
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    setFormData((prev) => ({
      ...prev,
      poNumber: `PO-${year}-${random}`,
    }));
    setView("form");
  };

  // Reset form to initial state
  const resetForm = () => {
    setEditingUuid(null);
    setFormData({
      po_number: "",
      vendor_uuid: "",
      vendor_name: "",
      issue_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      status: "DRAFT",
      notes: "",
    });
    resetItems();
    setErrors({});
  };

  // Cancel editing and go back to list
  const cancelEdit = () => {
    resetForm();
    setView("list");
  };

  return {
    // View state
    view,
    setView,
    loading,
    saving,
    errors,

    // List view data
    poList: paginatedData,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setCurrentPage,
    setPageSize,
    searchTerm,
    setSearchTerm,

    // Form data
    formData,
    setFormData,
    items,
    totals,
    editingUuid,
    suppliers,

    // Item operations
    updateItem,
    addItem,
    removeItem,

    // Product search
    productSearch,
    setProductSearch,
    productSuggestions,
    showProductDropdown,
    setShowProductDropdown,
    searchProducts,
    clearProductSearch,

    // Actions
    handleSave,
    deletePurchaseOrder,
    startEdit,
    handleCreateNew,
    cancelEdit,
    resetForm,
  };
}
