"use client";

import { useEffect, useState, useMemo } from "react";
import { getDatabase } from "../../db";
import { usePagination } from "../hooks/usePagination";
import { type Product } from "../../db/schemas/product";
import { type ProductVariant } from "../../db/schemas/product_variants";

type InventoryItem = {
  uuid: string;
  name: string;
  sku: string | null;
  selling_price: number | null;
  current_stock: number | null;
  minimum_stock_level: number | null;
  is_active: boolean | null;
  unit_singular: string;
  unit_plural: string;
  // product specific
  category_name?: string;
  // variant specific
  attribute_type?: string;
  attribute_value?: string;
};

export function useInventoryViewModel(activeMode: "products" | "variants") {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Raw data
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  // Load all required data
  useEffect(() => {
    if (!db) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsRes, variantsRes, categoriesRes, unitsRes] =
          await Promise.all([
            db.query.products.findMany({
              where: (p: any, { isNull }: any) => isNull(p.deleted_at),
            }),
            db.query.productVariants.findMany({
              where: (v: any, { isNull }: any) => isNull(v.deleted_at),
            }),
            db.query.categories.findMany({
              where: (c: any, { isNull }: any) => isNull(c.deleted_at),
            }),
            db.query.units.findMany(),
          ]);
        setProductsList(productsRes);
        setVariantsList(variantsRes);
        setCategories(categoriesRes);
        setUnits(unitsRes);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [db]);

  const getUnitNames = (unitUuid: string) => {
    const unit = units.find((u) => u.uuid === unitUuid);
    return {
      singular: unit?.singular?.toLowerCase() || "unit",
      plural: unit?.plural?.toLowerCase() || "units",
    };
  };

  const rawItems: InventoryItem[] = useMemo(() => {
    if (activeMode === "products") {
      return productsList.map((p) => {
        const { singular, plural } = getUnitNames(p.uom || "");
        const category = categories.find((c) => c.uuid === p.category_id);
        return {
          uuid: p.uuid,
          name: p.name,
          sku: p.sku,
          selling_price: p.selling_price,
          current_stock: p.current_stock,
          minimum_stock_level: p.minimum_stock_level,
          is_active: p.is_active,
          unit_singular: singular,
          unit_plural: plural,
          category_name: category?.name,
        };
      });
    } else {
      // variants – join with parent product manually
      return variantsList
        .map((v) => {
          const parent = productsList.find((p) => p.uuid === v.product_id);
          if (!parent) return null;
          const { singular, plural } = getUnitNames(parent.uom || "");
          return {
            uuid: v.uuid,
            name: `${parent.name} (${v.attribute_type}: ${v.attribute_value})`,
            sku: v.sku,
            selling_price: v.selling_price,
            current_stock: v.current_stock,
            minimum_stock_level: v.minimum_stock_level,
            is_active: true, // variants table has no is_active, assume true
            unit_singular: singular,
            unit_plural: plural,
            attribute_type: v.attribute_type,
            attribute_value: v.attribute_value,
          };
        })
        .filter(Boolean) as InventoryItem[];
    }
  }, [activeMode, productsList, variantsList, categories, units]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return rawItems;
    const term = searchTerm.toLowerCase();
    return rawItems.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term),
    );
  }, [rawItems, searchTerm]);

  const {
    paginatedData: items,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
  } = usePagination({
    data: filteredItems,
    initialPageSize: 10,
    searchKeys: [],
  });

  const stats = useMemo(() => {
    const totalSkus = filteredItems.length;
    const totalValue = filteredItems.reduce(
      (sum, item) =>
        sum + (item.selling_price ?? 0) * (item.current_stock ?? 0),
      0,
    );
    const lowStockCount = filteredItems.filter(
      (item) => (item.current_stock ?? 0) <= (item.minimum_stock_level ?? 0),
    ).length;
    return { totalSkus, totalValue, lowStockCount };
  }, [filteredItems]);

  const categoriesMap = useMemo(
    () => new Map(categories.map((c) => [c.uuid, c.name])),
    [categories],
  );
  const unitsMap = useMemo(
    () => new Map(units.map((u) => [u.uuid, u])),
    [units],
  );
  const productsMap = useMemo(
    () => new Map(productsList.map((p) => [p.uuid, p])),
    [productsList],
  );

  return {
    items,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
    stats,
    categoriesMap,
    unitsMap,
    productsMap,
  };
}
