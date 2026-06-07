import { useState, useEffect, useMemo } from "react";
import { useServiceSalesViewModel } from "../../sales/sale-service/useServiceSalesViewModel";

export interface ServiceCustomerDebtGroup {
  customer_id: string | null;
  customer_name: string;
  total_due: number; // sum of (total_amount - amount_paid) across unpaid service sales
  sale_uuids: string[]; // list of sale UUIDs with pending balance
  sales: any[]; // full sale objects for this customer (unpaid)
}

export function useServiceDebtorsViewModel() {
  const {
    getSaleDetails,
    updateHistoricPayment,
    refreshHistory,
    salesHistoryList,
    loading: serviceLoading,
  } = useServiceSalesViewModel();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Filter to unpaid sales (remaining balance > 0, not cancelled)
  const unpaidServiceSales = useMemo(() => {
    return salesHistoryList.filter((sale) => {
      const total = Number(sale.total_amount) || 0;
      const paid = Number(sale.amount_paid) || 0;
      const balance = total - paid;
      return balance > 0 && sale.status !== "CANCELLED";
    });
  }, [salesHistoryList]);

  // Group unpaid sales by customer
  const groupedDebtors = useMemo(() => {
    const groups: Record<string, ServiceCustomerDebtGroup> = {};

    for (const sale of unpaidServiceSales) {
      const customerId = sale.customer_id || "null";
      const customerName = sale.customer_name || "Walk-in Guest Profile";
      const remaining = (sale.total_amount || 0) - (sale.amount_paid || 0);

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
  }, [unpaidServiceSales]);

  // Apply search term (customer name or any sale items summary)
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedDebtors;
    const term = searchTerm.toLowerCase();
    return groupedDebtors.filter((group) => {
      if (group.customer_name.toLowerCase().includes(term)) return true;
      // Search inside individual sale items summaries
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

  // Reset page when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  // Helper to get all unpaid service sales for a customer (fresh data)
  const getUnpaidSalesForCustomer = async (customerId: string | null) => {
    await refreshHistory(); // refresh to get latest payment status
    // After refresh, filter from the updated salesHistoryList
    const freshUnpaid = salesHistoryList.filter((sale) => {
      const isSameCustomer =
        (customerId === null && sale.customer_id === null) ||
        sale.customer_id === customerId;
      const hasBalance = (sale.total_amount || 0) - (sale.amount_paid || 0) > 0;
      return isSameCustomer && hasBalance && sale.status !== "CANCELLED";
    });
    return freshUnpaid;
  };

  return {
    debtorsGroups: paginatedGroups,
    loading: serviceLoading,
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
    updateHistoricPayment,
    refreshServiceDebtors: refreshHistory,
    getUnpaidSalesForCustomer,
  };
}
