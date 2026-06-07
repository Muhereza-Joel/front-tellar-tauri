import { useState, useEffect, useMemo } from "react";
import { useSalesViewModel } from "../sales/useSalesViewModel";

export interface CustomerDebtGroup {
  customer_id: string | null;
  customer_name: string;
  total_due: number; // sum of (total_amount - amount_paid) across unpaid sales
  sale_uuids: string[]; // list of sale UUIDs with pending balance
  sales: any[]; // full sale objects for this customer (unpaid)
}

export function useDebtorsViewModel() {
  const {
    getSaleDetails,
    updateSalePayment,
    refreshSales,
    salesList,
    loading: salesLoading,
  } = useSalesViewModel();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Filter to unpaid sales (remaining balance > 0)
  const unpaidSales = useMemo(() => {
    return salesList.filter((sale) => {
      const remainingBalance = sale.total_amount - sale.amount_paid;
      return remainingBalance > 0;
    });
  }, [salesList]);

  // Group unpaid sales by customer
  const groupedDebtors = useMemo(() => {
    const groups: Record<string, CustomerDebtGroup> = {};

    for (const sale of unpaidSales) {
      const customerId = sale.customer_id || "null";
      const customerName = sale.customer_name || "Unregistered Account";
      const remaining = sale.total_amount - sale.amount_paid;

      if (!groups[customerId]) {
        groups[customerId] = {
          customer_id: sale.customer_id,
          customer_name: customerName,
          total_due: 0,
          sale_uuids: [],
          sales: [],
        };
      }
      groups[customerId].total_due += remaining;
      groups[customerId].sale_uuids.push(sale.uuid);
      groups[customerId].sales.push(sale);
    }

    return Object.values(groups);
  }, [unpaidSales]);

  // Apply search term (filters customer name or any sale items summary)
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedDebtors;
    const term = searchTerm.toLowerCase();
    return groupedDebtors.filter((group) => {
      if (group.customer_name.toLowerCase().includes(term)) return true;
      // Also search inside individual sale items summaries
      return group.sales.some((sale) =>
        sale.items_summary?.toLowerCase().includes(term),
      );
    });
  }, [groupedDebtors, searchTerm]);

  // Pagination on grouped list
  const totalCount = filteredGroups.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGroups.slice(start, start + pageSize);
  }, [filteredGroups, currentPage, pageSize]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  // Helper to get all unpaid sales for a customer (already in memory, but we need fresh data for dialog)
  const getUnpaidSalesForCustomer = async (customerId: string | null) => {
    // Refresh sales first to get latest payment status
    await refreshSales();
    // Filter from current salesList (already loaded via refreshSales)
    const freshUnpaid = salesList.filter((sale) => {
      const isSameCustomer =
        (customerId === null && sale.customer_id === null) ||
        sale.customer_id === customerId;
      const hasBalance = sale.total_amount - sale.amount_paid > 0;
      return isSameCustomer && hasBalance;
    });
    return freshUnpaid;
  };

  return {
    // Grouped data for UI
    debtorsGroups: paginatedGroups,
    loading: salesLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
    setDateFrom,
    setDateTo,
    getSaleDetails,
    updateSalePayment,
    refreshDebtors: refreshSales,
    getUnpaidSalesForCustomer,
  };
}
