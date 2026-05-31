"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getDatabase } from "../../../db";
import {
  purchaseOrders,
  purchaseOrderItems,
} from "../../../db/schemas/purchase_orders";
import { suppliers } from "../../../db/schemas/suppliers";
import { eq, isNull, desc, sql } from "drizzle-orm";
import * as yup from "yup";
import { v7 as uuidv7 } from "uuid";
import { usePurchaseOrderItems } from "./usePurchaseOrderItems";
import { useProductLookup } from "./useProductLookup";
import { PurchaseOrderStateContext } from "./state/purchaseOrderStateContext";
import { useAuth } from "../../context/AuthContext";

const purchaseOrderSchema = yup.object({
  po_number: yup.string().required("PO Number is required"),
  vendor_uuid: yup.string().required("Supplier selection is required"),
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

export function usePurchaseOrderViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [view, setView] = useState<"list" | "form">("list");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [_generatingPoNumber, setGeneratingPoNumber] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [rawPoList, setRawPoList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const itemModel = usePurchaseOrderItems();
  const lookupModel = useProductLookup(db);

  const [formData, setFormData] = useState<any>({
    po_number: "",
    vendor_uuid: "",
    vendor_name: "",
    issue_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    status: "DRAFT",
    notes: "",
  });

  // State context ref
  const stateContextRef = useRef<PurchaseOrderStateContext | null>(null);

  useEffect(() => {
    async function init() {
      const instance = await getDatabase();
      setDb(instance);
    }
    init();
  }, []);

  useEffect(() => {
    if (db) loadData();
  }, [db]);

  const loadData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const pos = await db
        .select()
        .from(purchaseOrders)
        .where(isNull(purchaseOrders.deleted_at))
        .orderBy(desc(purchaseOrders.created_at));

      const sups = await db
        .select()
        .from(suppliers)
        .where(isNull(suppliers.deleted_at));

      setRawPoList(pos);
      setSuppliersList(sups);
    } catch (err) {
      console.error("Failed to load procurement data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPoList = useMemo(() => {
    if (!searchTerm.trim()) return rawPoList;
    const term = searchTerm.toLowerCase();
    return rawPoList.filter(
      (po) =>
        po.po_number?.toLowerCase().includes(term) ||
        po.vendor_name?.toLowerCase().includes(term),
    );
  }, [rawPoList, searchTerm]);

  const totalCount = filteredPoList.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPoList.slice(start, start + pageSize);
  }, [filteredPoList, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const setVendorSelected = (vendorUuid: string) => {
    const target = suppliersList.find((s) => s.uuid === vendorUuid);
    setFormData((prev: any) => ({
      ...prev,
      vendor_uuid: vendorUuid,
      vendor_name: target ? target.name : "",
    }));
  };

  const loadPurchaseOrderForEdit = async (uuid: string) => {
    if (!db) return;
    try {
      const records = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.uuid, uuid))
        .limit(1);

      if (records.length === 0) return;
      const order = records[0];

      // Initialize state context with the order's current status
      stateContextRef.current = new PurchaseOrderStateContext(order.status);

      const lines = await db
        .select()
        .from(purchaseOrderItems)
        .where(
          sql`${purchaseOrderItems.purchase_order_uuid} = ${uuid} AND ${purchaseOrderItems.deleted_at} IS NULL`,
        );

      setFormData({
        po_number: order.po_number,
        vendor_uuid: order.vendor_uuid,
        vendor_name: order.vendor_name,
        issue_date: order.issue_date,
        expected_delivery_date: order.expected_delivery_date || "",
        status: order.status,
        notes: order.notes || "",
      });

      const mappedItems = lines.map((line: any) => ({
        product_uuid: line.product_uuid,
        product_name: line.product_name,
        sku: line.sku,
        quantity: line.quantity,
        unit_price: line.unit_price,
        received_quantity: line.received_quantity || 0,
        _uuid: line.uuid,
      }));
      itemModel.setItems(mappedItems);
    } catch (err) {
      console.error("Failed loading PO for edit:", err);
    }
  };

  const generatePoNumber = async () => {
    setGeneratingPoNumber(true);
    try {
      const poNumber = await invoke<string>("cmd_generate_po_number");
      setFormData((prev: any) => ({ ...prev, po_number: poNumber }));
    } catch (error) {
      console.error("Failed to generate PO number:", error);
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      setFormData((prev: any) => ({
        ...prev,
        po_number: `PO-${year}-${random}`,
      }));
    } finally {
      setGeneratingPoNumber(false);
    }
  };

  const handleCreateNew = async () => {
    resetForm();
    stateContextRef.current = new PurchaseOrderStateContext("DRAFT");
    await generatePoNumber();
    setView("form");
  };

  const startEdit = (uuid: string) => {
    setEditingUuid(uuid);
    setErrors({});
    setView("form");
    loadPurchaseOrderForEdit(uuid);
  };

  const resetForm = () => {
    setEditingUuid(null);
    stateContextRef.current = null;
    setFormData({
      po_number: "",
      vendor_uuid: "",
      vendor_name: "",
      issue_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      status: "DRAFT",
      notes: "",
    });
    itemModel.resetItems();
    setErrors({});
  };

  const deletePurchaseOrder = async (uuid: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to delete this purchase order?"))
      return;
    try {
      const now = new Date().toISOString();
      await db
        .update(purchaseOrders)
        .set({ deleted_at: now, sync_status: "deleted" })
        .where(eq(purchaseOrders.uuid, uuid));

      await db
        .update(purchaseOrderItems)
        .set({ deleted_at: now, sync_status: "deleted" })
        .where(eq(purchaseOrderItems.purchase_order_uuid, uuid));

      await loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSave = async (e: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!db || saving) return;

    setSaving(true);
    setErrors({});

    try {
      await purchaseOrderSchema.validate(formData, { abortEarly: false });

      if (itemModel.items.length === 0) {
        setErrors({ items: "At least one line item is required" });
        setSaving(false);
        return;
      }

      const timestamp = new Date().toISOString();
      const subtotal = itemModel.totals.subtotal;
      const totalAmount = subtotal;
      const tenantId = getTenantId();

      // --- NEW ORDER ---
      if (!editingUuid) {
        const orderUuid = uuidv7();
        await db.insert(purchaseOrders).values({
          uuid: orderUuid,
          po_number: formData.po_number,
          vendor_uuid: formData.vendor_uuid,
          vendor_name: formData.vendor_name,
          issue_date: formData.issue_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          status: formData.status,
          subtotal: subtotal,
          total_amount: totalAmount,
          notes: formData.notes || null,
          tenant_id: tenantId,
          created_at: timestamp,
          updated_at: timestamp,
          sync_status: "created",
        });

        for (const line of itemModel.items) {
          await db.insert(purchaseOrderItems).values({
            uuid: uuidv7(),
            purchase_order_uuid: orderUuid,
            product_uuid: line.product_uuid,
            product_name: line.product_name,
            sku: line.sku,
            quantity: line.quantity,
            received_quantity: line.received_quantity || 0,
            unit_price: line.unit_price,
            total_price: line.quantity * line.unit_price,
            tenant_id: tenantId,
            created_at: timestamp,
            updated_at: timestamp,
            sync_status: "created",
          });
        }
      }
      // --- UPDATE EXISTING ORDER ---
      else {
        const ctx = stateContextRef.current;
        if (!ctx) throw new Error("State context not initialized");
        if (ctx.isLocked()) {
          throw new Error(
            "Cannot modify a locked purchase order (Received or Cancelled).",
          );
        }

        // Helper to compute status from received quantities
        const computeReceivingStatus = (items: any[]): string => {
          if (items.length === 0) return "DRAFT";

          const allFullyReceived = items.every(
            (i) => (i.received_quantity || 0) >= i.quantity,
          );
          const anyPartial = items.some(
            (i) =>
              (i.received_quantity || 0) > 0 &&
              (i.received_quantity || 0) < i.quantity,
          );

          if (allFullyReceived) return "RECEIVED";
          if (anyPartial) return "PARTIALLY_RECEIVED";

          // If no receiving yet, keep whatever was set manually
          // e.g. SENT or CANCELLED should remain untouched
          return items.some((i) => (i.received_quantity || 0) > 0)
            ? "DRAFT"
            : (formData.status ?? "DRAFT");
        };

        // 1. Update received quantities if order is not in DRAFT
        if (!ctx.canEditItems()) {
          const existingItems = await db
            .select()
            .from(purchaseOrderItems)
            .where(
              sql`${purchaseOrderItems.purchase_order_uuid} = ${editingUuid} AND ${purchaseOrderItems.deleted_at} IS NULL`,
            );

          for (const existing of existingItems) {
            const updatedItem = itemModel.items.find(
              (i) => i.product_uuid === existing.product_uuid,
            );
            if (
              updatedItem &&
              updatedItem.received_quantity !== existing.received_quantity
            ) {
              await db
                .update(purchaseOrderItems)
                .set({
                  received_quantity: updatedItem.received_quantity || 0,
                  updated_at: timestamp,
                  sync_status: "updated",
                })
                .where(eq(purchaseOrderItems.uuid, existing.uuid));
            }
          }
        }

        // 2. Compute final status based on current items
        const newStatus = computeReceivingStatus(itemModel.items);

        // 3. Prepare header updates (respect permissions from original state)
        const headerUpdates: any = {
          updated_at: timestamp,
          sync_status: "updated",
          status: newStatus,
        };
        if (ctx.canEditDeliveryDate()) {
          headerUpdates.expected_delivery_date =
            formData.expected_delivery_date || null;
        }
        if (ctx.canEditNotes()) {
          headerUpdates.notes = formData.notes || null;
        }
        if (ctx.canEditHeader()) {
          headerUpdates.po_number = formData.po_number;
          headerUpdates.vendor_uuid = formData.vendor_uuid;
          headerUpdates.vendor_name = formData.vendor_name;
          headerUpdates.issue_date = formData.issue_date;
          headerUpdates.subtotal = subtotal;
          headerUpdates.total_amount = totalAmount;
        }

        await db
          .update(purchaseOrders)
          .set(headerUpdates)
          .where(eq(purchaseOrders.uuid, editingUuid));

        // 4. Full item replacement only for DRAFT orders
        if (ctx.canEditItems()) {
          await db
            .update(purchaseOrderItems)
            .set({ deleted_at: timestamp, sync_status: "deleted" })
            .where(eq(purchaseOrderItems.purchase_order_uuid, editingUuid));

          for (const line of itemModel.items) {
            await db.insert(purchaseOrderItems).values({
              uuid: uuidv7(),
              purchase_order_uuid: editingUuid,
              product_uuid: line.product_uuid,
              product_name: line.product_name,
              sku: line.sku,
              quantity: line.quantity,
              received_quantity: line.received_quantity || 0,
              unit_price: line.unit_price,
              total_price: line.quantity * line.unit_price,
              tenant_id: tenantId,
              created_at: timestamp,
              updated_at: timestamp,
              sync_status: "created",
            });
          }
        }
      }

      resetForm();
      setView("list");
      await loadData();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const mapped: Record<string, string> = {};
        err.inner.forEach((e: any) => {
          if (e.path) mapped[e.path] = e.message;
        });
        setErrors(mapped);
      } else {
        console.error("Save error:", err);
        setErrors({ general: err.message || "Failed to save purchase order." });
      }
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "SENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "PARTIALLY_RECEIVED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "RECEIVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statePermissions = {
    canEditHeader: stateContextRef.current?.canEditHeader() ?? true,
    canEditItems: stateContextRef.current?.canEditItems() ?? true,
    canReceiveItems: stateContextRef.current?.canReceiveItems() ?? false,
    canEditDeliveryDate: stateContextRef.current?.canEditDeliveryDate() ?? true,
    canEditNotes: stateContextRef.current?.canEditNotes() ?? true,
    canManualStatusChange:
      stateContextRef.current?.canManualStatusChange() ?? true,
    isLocked: stateContextRef.current?.isLocked() ?? false,
  };

  return {
    view,
    setView,
    loading,
    saving,
    errors,
    editingUuid,
    poList: paginatedData,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setCurrentPage,
    setPageSize,
    searchTerm,
    setSearchTerm,
    formData,
    setFormData,
    setVendorSelected,
    handleCreateNew,
    startEdit,
    deletePurchaseOrder,
    handleSave,
    suppliers: suppliersList,
    getStatusColor,

    items: itemModel.items,
    totals: itemModel.totals,
    addItem: itemModel.addItem,
    removeItem: itemModel.removeItem,
    updateItem: itemModel.updateItem,

    productSearch: lookupModel.productSearch,
    setProductSearch: lookupModel.setProductSearch,
    productSuggestions: lookupModel.productSuggestions,
    showProductDropdown: lookupModel.showProductDropdown,
    setShowProductDropdown: lookupModel.setShowProductDropdown,
    searchProducts: lookupModel.searchProducts,
    clearProductSearch: lookupModel.clearProductSearch,

    ...statePermissions,
  };
}
