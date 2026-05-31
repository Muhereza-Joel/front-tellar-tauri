"use client";

import { useEffect, useState } from "react";
import { getDatabase } from "../../../db";
import {
  serviceSales,
  serviceSaleItems,
} from "../../../db/schemas/service_sales";
import { services } from "../../../db/schemas/services";
import { serviceVariants } from "../../../db/schemas/service_variants";
import { customers } from "../../../db/schemas/customer";
import { discounts, Discount } from "../../../db/schemas/discounts"; // <-- Import discounts schema
import { eq, isNull, desc, and, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import * as yup from "yup";
import { useAuth } from "../../context/AuthContext";

export interface ServiceCartItem {
  service_id: string;
  variant_id: string | null;
  service_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_rental: boolean;
  rental_unit: string | null;
  deposit_required: number;
}

interface ServiceSaleWithDetails {
  uuid: string;
  customer_id: string | null;
  customer_name: string | null;
  type: "DIRECT" | "INVOICE" | "APPOINTMENT";
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  total_amount: number;
  amount_paid: number;
  discount_amount: number; // <-- Added discount layout tracking field
  discount_id: string | null;
  created_at: string;
  deleted_at: string | null;
  items_summary: string;
}

const serviceSaleValidationSchema = yup.object({
  customer_id: yup.string().nullable(),
  type: yup.string().oneOf(["DIRECT", "INVOICE", "APPOINTMENT"]).required(),
  status: yup.string().oneOf(["COMPLETED", "PENDING", "CANCELLED"]).required(),
  amount_paid: yup.number().min(0).required(),
  discount_id: yup.string().nullable(),
  discount_amount: yup.number().min(0).required(),
  cartItems: yup
    .array()
    .min(1, "At least one service must be added to the queue"),
});

export function useServiceSalesViewModel() {
  const { getTenantId } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Layout Tab Mode Status
  const [activeMainTab, setActiveMainTab] = useState<"new" | "history">("new");

  // Historic Database Query Ledgers State
  const [salesHistoryList, setSalesHistoryList] = useState<
    ServiceSaleWithDetails[]
  >([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [variantsList, setVariantsList] = useState<any[]>([]);
  const [discountsList, setDiscountsList] = useState<Discount[]>([]); // <-- Discounts Registry State

  // Search, Filters & Pagination Ledger Parameters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New Transaction Interactive Workspace Queue State
  const [cartItems, setCartItems] = useState<ServiceCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [saleType, setSaleType] = useState<
    "DIRECT" | "INVOICE" | "APPOINTMENT"
  >("DIRECT");
  const [saleStatus, setSaleStatus] = useState<
    "COMPLETED" | "PENDING" | "CANCELLED"
  >("COMPLETED");
  const [amountPaidRaw, setAmountPaidRaw] = useState<string>("0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Discount Selection Workspace parameters
  const [isDiscountEnabled, setIsDiscountEnabled] = useState<boolean>(false);
  const [selectedDiscountUuid, setSelectedDiscountUuid] = useState<string>("");

  // Form selection parameters
  const [selectedServiceUuid, setSelectedServiceUuid] = useState<string>("");
  const [selectedVariantUuid, setSelectedVariantUuid] = useState<string>("");
  const [quantityToAdd, setQuantityToAdd] = useState(1);

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  useEffect(() => {
    if (db) {
      loadSalesHistory();
      loadDependencies();
      loadDiscounts(); // <-- Run discounts loader context
    }
  }, [db]);

  const loadDependencies = async () => {
    try {
      const clients = await db
        .select()
        .from(customers)
        .where(
          and(isNull(customers.deleted_at), eq(customers.is_active, true)),
        );

      const servs = await db
        .select()
        .from(services)
        .where(isNull(services.deleted_at));

      const vars = await db
        .select()
        .from(serviceVariants)
        .where(isNull(serviceVariants.deleted_at));

      setCustomersList(clients);
      setServicesList(servs);
      setVariantsList(vars);
    } catch (err) {
      console.error("Error creating setup registries", err);
    }
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

  const loadSalesHistory = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const salesData = await db
        .select({
          uuid: serviceSales.uuid,
          customer_id: serviceSales.customer_id,
          customer_name: sql<string>`${customers.first_name} || ' ' || ${customers.last_name}`,
          type: serviceSales.type,
          status: serviceSales.status,
          total_amount: serviceSales.total_amount,
          amount_paid: serviceSales.amount_paid,
          discount_amount: serviceSales.discount_amount, // <-- Select field context
          discount_id: serviceSales.discount_id, // <-- Select field context
          created_at: serviceSales.created_at,
          deleted_at: serviceSales.deleted_at,
        })
        .from(serviceSales)
        .leftJoin(customers, eq(serviceSales.customer_id, customers.uuid))
        .where(isNull(serviceSales.deleted_at))
        .orderBy(desc(serviceSales.created_at));

      const salesWithSummaries = await Promise.all(
        salesData.map(async (sale: any) => {
          const items = await db
            .select({
              quantity: serviceSaleItems.quantity,
              service_name: services.name,
              variant_name: serviceVariants.name,
            })
            .from(serviceSaleItems)
            .leftJoin(services, eq(serviceSaleItems.service_id, services.uuid))
            .leftJoin(
              serviceVariants,
              eq(serviceSaleItems.variant_id, serviceVariants.uuid),
            )
            .where(eq(serviceSaleItems.service_sale_id, sale.uuid));

          const summary = items
            .map((i: any) => {
              const tierStr = i.variant_name ? ` (${i.variant_name})` : "";
              return `${i.service_name}${tierStr} x${i.quantity}`;
            })
            .join(", ");

          return { ...sale, items_summary: summary || "No items assigned" };
        }),
      );

      setSalesHistoryList(salesWithSummaries);
    } catch (err) {
      console.error("Failed loading transaction history records", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = () => {
    loadSalesHistory();
  };

  // Live client-side structural row filtering operations
  const filteredSalesByDateAndStatus = salesHistoryList.filter((sale) => {
    if (statusFilter !== "ALL" && sale.status !== statusFilter) return false;

    if (dateFrom) {
      const saleDay = new Date(sale.created_at).toISOString().split("T")[0];
      if (saleDay < dateFrom) return false;
    }
    if (dateTo) {
      const saleDay = new Date(sale.created_at).toISOString().split("T")[0];
      if (saleDay > dateTo) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (sale.customer_name &&
          sale.customer_name.toLowerCase().includes(term)) ||
        sale.items_summary.toLowerCase().includes(term) ||
        sale.uuid.toLowerCase().includes(term)
      );
    }

    return true;
  });

  const totalCount = filteredSalesByDateAndStatus.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedHistoryData = filteredSalesByDateAndStatus.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Cart parsing selection dependencies
  const serviceOptions = servicesList
    .filter((s) => s.is_active)
    .map((s) => ({
      uuid: s.uuid,
      name: s.name,
      hasVariants: variantsList.some(
        (v) => v.service_id === s.uuid && v.is_active,
      ),
    }));

  const currentService = servicesList.find(
    (s) => s.uuid === selectedServiceUuid,
  );

  const availableVariants = selectedServiceUuid
    ? variantsList
        .filter((v) => v.service_id === selectedServiceUuid && v.is_active)
        .map((v) => {
          let derivedPrice = currentService?.base_price || 0;
          if (v.absolute_price !== null && v.absolute_price !== undefined) {
            derivedPrice = v.absolute_price;
          } else if (v.price_adjustment) {
            derivedPrice += v.price_adjustment;
          }

          return {
            uuid: v.uuid,
            label: v.name,
            calculatedPrice: derivedPrice,
            duration: v.duration_minutes || currentService?.duration_minutes,
            isRental: currentService?.is_rental,
            rentalUnit: v.rental_rate_unit || currentService?.rental_rate_unit,
            deposit:
              v.deposit_required !== null
                ? v.deposit_required
                : currentService?.deposit_required || 0,
          };
        })
    : [];

  const selectedVariant = availableVariants.find(
    (v) => v.uuid === selectedVariantUuid,
  );

  const currentPrice = selectedVariant
    ? selectedVariant.calculatedPrice
    : currentService
      ? currentService.base_price
      : 0;

  const subtotalAmount = cartItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  // Live markdown processing computation matching products workflow logic
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
  const amountPaid = parseFloat(amountPaidRaw) || 0;

  const addToCart = () => {
    if (!selectedServiceUuid || !currentService) {
      setErrors({ ...errors, service: "Please select a valid service item" });
      return;
    }

    if (availableVariants.length > 0 && !selectedVariantUuid) {
      setErrors({
        ...errors,
        variant: "This service features variants. Please pick one.",
      });
      return;
    }

    const unitPrice = currentPrice;
    const count = quantityToAdd > 0 ? quantityToAdd : 1;

    const depositRequired = selectedVariant
      ? selectedVariant.deposit
      : currentService.deposit_required || 0;

    const rentalUnit = selectedVariant
      ? selectedVariant.rentalUnit
      : currentService.rental_rate_unit || null;

    const existingIndex = cartItems.findIndex(
      (item) =>
        item.service_id === currentService.uuid &&
        item.variant_id === (selectedVariant?.uuid || null),
    );

    if (existingIndex !== -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += count;
      updated[existingIndex].subtotal =
        updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          service_id: currentService.uuid,
          variant_id: selectedVariant?.uuid || null,
          service_name: currentService.name,
          variant_label: selectedVariant ? selectedVariant.label : null,
          quantity: count,
          unit_price: unitPrice,
          subtotal: count * unitPrice,
          is_rental: !!currentService.is_rental,
          rental_unit: rentalUnit,
          deposit_required: depositRequired * count,
        },
      ]);
    }

    setSelectedServiceUuid("");
    setSelectedVariantUuid("");
    setQuantityToAdd(1);
    setErrors({});
  };

  const updateCartItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(index);
      return;
    }
    const updated = [...cartItems];
    const baseDepositUnit =
      updated[index].deposit_required / updated[index].quantity;

    updated[index].quantity = newQty;
    updated[index].subtotal = newQty * updated[index].unit_price;
    updated[index].deposit_required = baseDepositUnit * newQty;
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
      await serviceSaleValidationSchema.validate(
        {
          customer_id: selectedCustomer?.uuid || null,
          type: saleType,
          status: saleStatus,
          amount_paid: amountPaid,
          discount_id: appliedDiscountId,
          discount_amount: discountAmount,
          cartItems,
        },
        { abortEarly: false },
      );

      if (amountPaid > totalAmount) {
        setErrors({
          amount_paid: "Captured amount cannot exceed transaction totals.",
        });
        return;
      }

      if (!db) return;

      const saleUuid = uuidv7();
      const timestamp = new Date().toISOString();

      await db.insert(serviceSales).values({
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
        created_at: timestamp,
        updated_at: timestamp,
      });

      for (const item of cartItems) {
        await db.insert(serviceSaleItems).values({
          uuid: uuidv7(),
          service_sale_id: saleUuid,
          service_id: item.service_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          is_rental: item.is_rental,
          rental_unit: item.rental_unit,
          deposit_captured: item.deposit_required,
          tenant_id: getTenantId(),
          sync_status: "created",
          created_at: timestamp,
          updated_at: timestamp,
        });
      }

      resetForm();
      await loadSalesHistory();
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const mapped: Record<string, string> = {};
        err.inner.forEach((e: any) => {
          if (e.path) mapped[e.path] = e.message;
        });
        setErrors(mapped);
      } else {
        console.error(err);
        setErrors({
          general: "Operation aborted due to infrastructural system fault.",
        });
      }
    }
  };

  const updateHistoricPayment = async (
    saleUuid: string,
    newAmountPaid: number,
    newDiscountAmount: number = 0, // <-- Extend ledger parameters
  ) => {
    if (!db) throw new Error("Database context missing");

    const originalItems = await db
      .select({ subtotal: serviceSaleItems.subtotal })
      .from(serviceSaleItems)
      .where(eq(serviceSaleItems.service_sale_id, saleUuid));
    const itemsSubtotal = originalItems.reduce(
      (acc: number, cur: any) => acc + cur.subtotal,
      0,
    );
    const updatedTotalBill = Math.max(0, itemsSubtotal - newDiscountAmount);

    const resolvedStatus =
      newAmountPaid >= updatedTotalBill ? "COMPLETED" : "PENDING";

    await db
      .update(serviceSales)
      .set({
        amount_paid: newAmountPaid,
        discount_amount: newDiscountAmount,
        total_amount: updatedTotalBill,
        status: resolvedStatus,
        sync_status: "updated",
        updated_at: new Date().toISOString(),
      })
      .where(eq(serviceSales.uuid, saleUuid));

    await loadSalesHistory();
  };

  const getSaleDetails = async (saleUuid: string) => {
    if (!db) throw new Error("Database not connected");

    const header = await db
      .select({
        uuid: serviceSales.uuid,
        customer_id: serviceSales.customer_id,
        customer_name: sql<string>`${customers.first_name} || ' ' || ${customers.last_name}`,
        type: serviceSales.type,
        status: serviceSales.status,
        total_amount: serviceSales.total_amount,
        amount_paid: serviceSales.amount_paid,
        discount_amount: serviceSales.discount_amount, // <-- Select fields
        discount_id: serviceSales.discount_id, // <-- Select fields
        created_at: serviceSales.created_at,
      })
      .from(serviceSales)
      .leftJoin(customers, eq(serviceSales.customer_id, customers.uuid))
      .where(eq(serviceSales.uuid, saleUuid))
      .limit(1);

    const detailItems = await db
      .select({
        service_name: services.name,
        variant_name: serviceVariants.name,
        quantity: serviceSaleItems.quantity,
        unit_price: serviceSaleItems.unit_price,
        subtotal: serviceSaleItems.subtotal,
        is_rental: serviceSaleItems.is_rental,
        rental_unit: serviceSaleItems.rental_unit,
        deposit_captured: serviceSaleItems.deposit_captured,
      })
      .from(serviceSaleItems)
      .leftJoin(services, eq(serviceSaleItems.service_id, services.uuid))
      .leftJoin(
        serviceVariants,
        eq(serviceSaleItems.variant_id, serviceVariants.uuid),
      )
      .where(eq(serviceSaleItems.service_sale_id, saleUuid));

    return { sale: header[0], items: detailItems };
  };

  const resetForm = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setSaleType("DIRECT");
    setSaleStatus("COMPLETED");
    setAmountPaidRaw("0");
    setSelectedServiceUuid("");
    setSelectedVariantUuid("");
    setQuantityToAdd(1);
    setIsDiscountEnabled(false);
    setSelectedDiscountUuid("");
    setErrors({});
  };

  return {
    activeMainTab,
    setActiveMainTab,
    salesHistoryList: paginatedHistoryData,
    loading,
    cartItems,
    selectedCustomer,
    customers: customersList,
    saleType,
    setSaleType,
    saleStatus,
    setSaleStatus,
    amountPaidRaw,
    setAmountPaidRaw,
    subtotalAmount, // <-- Expose subtotal
    discountAmount, // <-- Expose calculated discount markdown
    totalAmount,
    errors,
    serviceOptions,
    selectedServiceUuid,
    setSelectedServiceUuid,
    selectedVariantUuid,
    setSelectedVariantUuid,
    availableVariants,
    currentPrice,
    quantityToAdd,
    setQuantityToAdd,
    setSelectedCustomer,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    saveSale,
    resetForm,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    totalCount,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    setDateFrom,
    setDateTo,
    refreshHistory,
    getSaleDetails,
    updateHistoricPayment,
    discountsList, // Extends active discount rules array
    isDiscountEnabled, // Workspace checkbox conditional value
    setIsDiscountEnabled,
    selectedDiscountUuid, // Configured layout ID string
    setSelectedDiscountUuid,
  };
}
