"use client";

import { useState, useMemo, useCallback } from "react";

export function usePurchaseOrderItems() {
  const [items, setItems] = useState<any[]>([]);

  const resetItems = useCallback(() => {
    setItems([]);
  }, []);

  const addItem = useCallback((product: any) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_uuid === product.uuid,
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          product_uuid: product.uuid,
          product_name: product.name,
          sku: product.sku || "",
          quantity: 1,
          unit_price: product.cost_price || 0,
          received_quantity: 0,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, key: string, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }, []);

  // Compute totals and overall receipt status
  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
    return { subtotal, total: subtotal };
  }, [items]);

  // Helper: compute if all items are fully received
  const isFullyReceived = useMemo(() => {
    if (items.length === 0) return false;
    return items.every(
      (item) => (item.received_quantity || 0) >= item.quantity,
    );
  }, [items]);

  // Helper: compute if any item has partial receipt
  const isPartiallyReceived = useMemo(() => {
    if (items.length === 0) return false;
    return items.some(
      (item) =>
        (item.received_quantity || 0) > 0 &&
        (item.received_quantity || 0) < item.quantity,
    );
  }, [items]);

  return {
    items,
    setItems,
    resetItems,
    addItem,
    removeItem,
    updateItem,
    totals,
    isFullyReceived,
    isPartiallyReceived,
  };
}
