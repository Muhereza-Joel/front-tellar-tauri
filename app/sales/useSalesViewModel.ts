"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../db";
import { sales, saleItems } from "../../db/schemas/sales";
import { customers } from "../../db/schemas/customer";
import { products } from "../../db/schemas/product";
import { productVariants } from "../../db/schemas/product_variants";
import { units } from "../../db/schemas/units";
import { discounts, Discount } from "../../db/schemas/discounts";
import { eq, isNull, desc, and, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import * as yup from "yup";
import { useAuth } from "../context/AuthContext";

interface CartItem {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface SaleWithDetails {
  uuid: string;
  customer_id: string | null;
  customer_name: string | null;
  type: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  discount_amount: number; // <-- Added to list model
  discount_id: string | null;
  created_at: string;
  deleted_at: string | null;
  items_summary: string;
}

const saleValidationSchema = yup.object({
  customer_id: yup.string().nullable(),
  type: yup.string().oneOf(["DIRECT", "INVOICE"]).required(),
  status: yup.string().oneOf(["COMPLETED", "PENDING", "CANCELLED"]).required(),
  amount_paid: yup.number().min(0).required(),
  cartItems: yup.array().min(1, "At least one item is required"),
  discount_id: yup.string().nullable(),
  discount_amount: yup.number().min(0).required(),
});

export function useSalesViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salesList, setSalesList] = useState<SaleWithDetails[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [variantsList, setVariantsList] = useState<any[]>([]);
  const [discountsList, setDiscountsList] = useState<Discount[]>([]);
  const [unitsMap, setUnitsMap] = useState<
    Map<string, { singular: string; plural: string }>
  >(new Map());

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeMainTab, setActiveMainTab] = useState<"new" | "history">("new");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [saleType, setSaleType] = useState<"DIRECT" | "INVOICE">("DIRECT");
  const [saleStatus, setSaleStatus] = useState<
    "COMPLETED" | "PENDING" | "CANCELLED"
  >("COMPLETED");
  const [amountPaidRaw, setAmountPaidRaw] = useState<string>("0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isDiscountEnabled, setIsDiscountEnabled] = useState<boolean>(false);
  const [selectedDiscountUuid, setSelectedDiscountUuid] = useState<string>("");

  const [selectedProductUuid, setSelectedProductUuid] = useState<string>("");
  const [selectedVariantUuid, setSelectedVariantUuid] = useState<string>("");
  const [quantityToAdd, setQuantityToAdd] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  useEffect(() => {
    if (db) {
      loadSales();
      loadCustomers();
      loadProductsAndVariants();
      loadDiscounts();
    }
  }, [db]);

  const loadSales = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const salesData = await db
        .select({
          uuid: sales.uuid,
          customer_id: sales.customer_id,
          customer_name: sql<string>`${customers.first_name} || ' ' || ${customers.last_name}`,
          type: sales.type,
          status: sales.status,
          total_amount: sales.total_amount,
          amount_paid: sales.amount_paid,
          discount_amount: sales.discount_amount, // <-- Selected field
          discount_id: sales.discount_id, // <-- Selected field
          created_at: sales.created_at,
          deleted_at: sales.deleted_at,
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customer_id, customers.uuid))
        .where(isNull(sales.deleted_at))
        .orderBy(desc(sales.created_at));

      const salesWithItems = await Promise.all(
        salesData.map(async (sale: any) => {
          const items = await db
            .select({
              product_id: saleItems.product_id,
              variant_id: saleItems.variant_id,
              quantity: saleItems.quantity,
              product_name: products.name,
              variant_type: productVariants.attribute_type,
              variant_value: productVariants.attribute_value,
              unit_uom: products.uom,
            })
            .from(saleItems)
            .leftJoin(products, eq(saleItems.product_id, products.uuid))
            .leftJoin(
              productVariants,
              eq(saleItems.variant_id, productVariants.uuid),
            )
            .where(eq(saleItems.sale_id, sale.uuid));

          const summary = items
            .map((item: any) => {
              let name = item.product_name;
              if (item.variant_type && item.variant_value) {
                name += ` (${item.variant_type}: ${item.variant_value})`;
              }
              const unitInfo = unitsMap.get(item.unit_uom);
              const unitLabel = unitInfo?.plural || "units";
              return `${name} x${item.quantity} ${unitLabel}`;
            })
            .join(", ");

          return { ...sale, items_summary: summary || "No items" };
        }),
      );

      setSalesList(salesWithItems);
    } finally {
      setLoading(false);
    }
  };

  const refreshSales = () => {
    loadSales();
  };

  const loadCustomers = async () => {
    if (!db) return;
    const results = await db
      .select()
      .from(customers)
      .where(and(isNull(customers.deleted_at), eq(customers.is_active, true)));
    setCustomersList(results);
  };

  const loadDiscounts = async () => {
    if (!db) return;
    const nowStr = new Date().toISOString().split("T")[0];
    const results = await db
      .select()
      .from(discounts)
      .where(
        and(
          eq(discounts.isActive, true),
          isNull(discounts.deleted_at),
          sql`(${discounts.startDate} IS NULL OR ${discounts.startDate} <= ${nowStr})`,
          sql`(${discounts.endDate} IS NULL OR ${discounts.endDate} >= ${nowStr})`,
        ),
      );
    setDiscountsList(results);
  };

  const loadProductsAndVariants = async () => {
    if (!db) return;
    const prods = await db
      .select()
      .from(products)
      .where(eq(products.is_active, true));
    const vars = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.is_active, true));

    const unitsList = await db
      .select({
        uuid: units.uuid,
        singular: units.singular,
        plural: units.plural,
      })
      .from(units)
      .where(eq(units.is_active, true));

    const unitMap = new Map<string, { singular: string; plural: string }>();
    unitsList.forEach((unit: any) => {
      unitMap.set(unit.uuid, { singular: unit.singular, plural: unit.plural });
    });

    setUnitsMap(unitMap);
    setProductsList(prods);
    setVariantsList(vars);
  };

  const filteredByDate = (sale: SaleWithDetails) => {
    if (!dateFrom && !dateTo) return true;
    const saleDate = new Date(sale.created_at).toISOString().split("T")[0];
    if (dateFrom && saleDate < dateFrom) return false;
    if (dateTo && saleDate > dateTo) return false;
    return true;
  };

  const filteredSales = salesList.filter((sale) => {
    if (statusFilter !== "ALL" && sale.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (sale.customer_name &&
          sale.customer_name.toLowerCase().includes(term)) ||
        sale.items_summary.toLowerCase().includes(term)
      );
    }
    return filteredByDate(sale);
  });

  const totalCount = filteredSales.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedData = filteredSales.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const productOptions = productsList.map((p) => ({
    uuid: p.uuid,
    name: p.name,
    hasVariants: variantsList.some((v) => v.product_id === p.uuid),
  }));

  const getVariantsForProduct = (productUuid: string) => {
    const variants = variantsList.filter((v) => v.product_id === productUuid);
    return variants.map((v) => ({
      uuid: v.uuid,
      label: `${v.attribute_type}: ${v.attribute_value}`,
      price: v.selling_price,
    }));
  };

  const selectedProduct = productsList.find(
    (p) => p.uuid === selectedProductUuid,
  );
  const availableVariants = selectedProductUuid
    ? getVariantsForProduct(selectedProductUuid)
    : [];
  const selectedVariant = variantsList.find(
    (v) => v.uuid === selectedVariantUuid,
  );
  const currentPrice = selectedVariant
    ? selectedVariant.selling_price
    : selectedProduct
      ? selectedProduct.selling_price
      : 0;
  const amountPaid = parseFloat(amountPaidRaw) || 0;

  const subtotalAmount = cartItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  const activeDiscount = discountsList.find(
    (d) => d.uuid === selectedDiscountUuid,
  );
  let discountAmount = 0;
  if (isDiscountEnabled && activeDiscount) {
    if (activeDiscount.type === "PERCENTAGE") {
      discountAmount = (subtotalAmount * activeDiscount.value) / 100;
    } else if (activeDiscount.type === "FIXED") {
      discountAmount = activeDiscount.value;
    }
  }

  if (discountAmount > subtotalAmount) {
    discountAmount = subtotalAmount;
  }

  const totalAmount = Math.max(0, subtotalAmount - discountAmount);

  const addToCart = () => {
    if (!selectedProductUuid) {
      setErrors({ ...errors, product: "Please select a product" });
      return;
    }
    const hasVariants = availableVariants.length > 0;
    if (hasVariants && !selectedVariantUuid) {
      setErrors({ ...errors, variant: "Please select a variant" });
      return;
    }
    const product = productsList.find((p) => p.uuid === selectedProductUuid);
    if (!product) return;
    const variant = selectedVariantUuid
      ? variantsList.find((v) => v.uuid === selectedVariantUuid)
      : null;
    const unitPrice = variant ? variant.selling_price : product.selling_price;
    const newQuantity = quantityToAdd > 0 ? quantityToAdd : 1;
    const existingIndex = cartItems.findIndex(
      (item) =>
        item.product_id === product.uuid &&
        item.variant_id === (variant?.uuid || null),
    );
    if (existingIndex !== -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += newQuantity;
      updated[existingIndex].subtotal =
        updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: product.uuid,
          variant_id: variant?.uuid || null,
          product_name: product.name,
          variant_label: variant
            ? `${variant.attribute_type}: ${variant.attribute_value}`
            : null,
          quantity: newQuantity,
          unit_price: unitPrice,
          subtotal: newQuantity * unitPrice,
        },
      ]);
    }
    setSelectedProductUuid("");
    setSelectedVariantUuid("");
    setQuantityToAdd(1);
    setErrors({ ...errors, product: "", variant: "" });
  };

  const updateCartItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(index);
      return;
    }
    const updated = [...cartItems];
    updated[index].quantity = newQty;
    updated[index].subtotal =
      updated[index].quantity * updated[index].unit_price;
    setCartItems(updated);
  };

  const removeCartItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const saveSale = async () => {
    setErrors({});
    const appliedDiscountId =
      isDiscountEnabled && selectedDiscountUuid ? selectedDiscountUuid : null;

    try {
      await saleValidationSchema.validate(
        {
          customer_id: selectedCustomer?.uuid || null,
          type: saleType,
          status: saleStatus,
          amount_paid: amountPaid,
          cartItems,
          discount_id: appliedDiscountId,
          discount_amount: discountAmount,
        },
        { abortEarly: false },
      );
      if (amountPaid > totalAmount) {
        setErrors({ amount_paid: "Amount paid cannot exceed total amount" });
        return;
      }
      if (!db) return;
      const saleUuid = uuidv7();
      const now = new Date().toISOString();

      await db.insert(sales).values({
        uuid: saleUuid,
        customer_id: selectedCustomer?.uuid || null,
        type: saleType,
        status: saleStatus,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        discount_id: appliedDiscountId,
        discount_amount: discountAmount,
        tenant_id: getTenantId(),
        sync_status: "created",
        created_at: now,
        updated_at: now,
      });

      for (const item of cartItems) {
        await db.insert(saleItems).values({
          uuid: uuidv7(),
          sale_id: saleUuid,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          sync_status: "created",
          tenant_id: getTenantId(),
          created_at: now,
          updated_at: now,
        });
      }
      resetForm();
      await loadSales();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const mapped: Record<string, string> = {};
        err.inner.forEach((e: any) => {
          if (e.path) mapped[e.path] = e.message;
        });
        setErrors(mapped);
      } else {
        console.error(err);
        setErrors({ general: "Failed to save sale" });
      }
    }
  };

  // UPDATED: Added discountAmount parameter to save edits back into the ledger
  const updateSalePayment = async (
    saleUuid: string,
    newAmountPaid: number,
    newDiscountAmount: number,
  ) => {
    if (!db) throw new Error("Database not initialized");

    // Recalculate dynamic totals securely based on original lines subtotal items
    const originalItems = await db
      .select({ subtotal: saleItems.subtotal })
      .from(saleItems)
      .where(eq(saleItems.sale_id, saleUuid));
    const itemsSubtotal = originalItems.reduce(
      (acc: number, cur: any) => acc + cur.subtotal,
      0,
    );
    const updatedTotalBill = Math.max(0, itemsSubtotal - newDiscountAmount);

    await db
      .update(sales)
      .set({
        sync_status: "updated",
        amount_paid: newAmountPaid,
        discount_amount: newDiscountAmount,
        total_amount: updatedTotalBill,
        updated_at: new Date().toISOString(),
        status: newAmountPaid >= updatedTotalBill ? "COMPLETED" : "PENDING",
      })
      .where(eq(sales.uuid, saleUuid));

    await loadSales();
  };

  const getSaleDetails = async (saleUuid: string) => {
    if (!db) throw new Error("Database not initialized");
    const saleData = await db
      .select({
        uuid: sales.uuid,
        customer_id: sales.customer_id,
        customer_name: sql<string>`${customers.first_name} || ' ' || ${customers.last_name}`,
        type: sales.type,
        status: sales.status,
        total_amount: sales.total_amount,
        amount_paid: sales.amount_paid,
        discount_amount: sales.discount_amount, // <-- Selected field
        discount_id: sales.discount_id, // <-- Selected field
        created_at: sales.created_at,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customer_id, customers.uuid))
      .where(eq(sales.uuid, saleUuid))
      .limit(1);

    const items = await db
      .select({
        product_name: products.name,
        variant_type: productVariants.attribute_type,
        variant_value: productVariants.attribute_value,
        quantity: saleItems.quantity,
        unit_price: saleItems.unit_price,
        subtotal: saleItems.subtotal,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.product_id, products.uuid))
      .leftJoin(productVariants, eq(saleItems.variant_id, productVariants.uuid))
      .where(eq(saleItems.sale_id, saleUuid));

    return { sale: saleData[0], items };
  };

  const resetForm = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setSaleType("DIRECT");
    setSaleStatus("COMPLETED");
    setAmountPaidRaw("0");
    setSelectedProductUuid("");
    setSelectedVariantUuid("");
    setQuantityToAdd(1);
    setIsDiscountEnabled(false);
    setSelectedDiscountUuid("");
    setErrors({});
  };

  return {
    salesList: paginatedData,
    loading,
    cartItems,
    selectedCustomer,
    customers: customersList,
    saleType,
    saleStatus,
    amountPaidRaw,
    setAmountPaidRaw,
    subtotalAmount,
    discountAmount,
    totalAmount,
    errors,
    productOptions,
    selectedProductUuid,
    setSelectedProductUuid,
    selectedVariantUuid,
    setSelectedVariantUuid,
    availableVariants,
    currentPrice,
    quantityToAdd,
    setQuantityToAdd,
    setSelectedCustomer,
    setSaleType,
    setSaleStatus,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    saveSale,
    resetForm,
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    setCurrentPage,
    setPageSize,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    activeMainTab,
    setActiveMainTab,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    refreshSales,
    getSaleDetails,
    updateSalePayment,
    discountsList,
    isDiscountEnabled,
    setIsDiscountEnabled,
    selectedDiscountUuid,
    setSelectedDiscountUuid,
  };
}
