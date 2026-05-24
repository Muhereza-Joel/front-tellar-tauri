// useProductLookup.ts (unchanged, but included for completeness)
"use client";

import { useState, useCallback } from "react";
import { sql } from "drizzle-orm";

export function useProductLookup(db: any) {
  const [productSearch, setProductSearch] = useState("");
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const clearProductSearch = useCallback(() => {
    setProductSearch("");
    setProductSuggestions([]);
    setShowProductDropdown(false);
  }, []);

  const searchProducts = useCallback(
    async (query: string) => {
      if (!db || !query.trim()) {
        setProductSuggestions([]);
        return;
      }

      try {
        const { products } = await import("../../../db/schemas/product");
        const matches = await db
          .select()
          .from(products)
          .where(
            sql`${products.deleted_at} IS NULL 
            AND (${products.name} LIKE ${`%${query}%`} OR ${products.sku} LIKE ${`%${query}%`})`,
          )
          .limit(10);

        setProductSuggestions(matches);
      } catch (err) {
        console.error("Product search failed:", err);
      }
    },
    [db],
  );

  return {
    productSearch,
    setProductSearch,
    productSuggestions,
    showProductDropdown,
    setShowProductDropdown,
    searchProducts,
    clearProductSearch,
  };
}
