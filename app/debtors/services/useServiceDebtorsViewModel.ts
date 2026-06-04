import { useState, useEffect, useMemo } from "react";
import { useServiceSalesViewModel } from "../../sales/sale-service/useServiceSalesViewModel";

export function useServiceDebtorsViewModel() {
  // Extract state and updates natively from your master service engine
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

  // Process array pipeline metrics down to actual unsettled entries
  const serviceDebtorsList = useMemo(() => {
    return salesHistoryList.filter((sale) => {
      const total = Number(sale.total_amount) || 0;
      const paid = Number(sale.amount_paid) || 0;
      const balance = total - paid;

      // Keep only unpaid, un-cancelled records
      const isUnsettledDebtor = balance > 0 && sale.status !== "CANCELLED";

      if (!isUnsettledDebtor) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const clientMatch = sale.customer_name?.toLowerCase().includes(query);
        const summaryMatch = sale.items_summary?.toLowerCase().includes(query);
        return clientMatch || summaryMatch;
      }

      return true;
    });
  }, [salesHistoryList, searchTerm]);

  // Handle pagination calculations
  const totalCount = serviceDebtorsList.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const paginatedList = useMemo(() => {
    const startOffset = (currentPage - 1) * pageSize;
    return serviceDebtorsList.slice(startOffset, startOffset + pageSize);
  }, [serviceDebtorsList, currentPage, pageSize]);

  // Anchor to page 1 whenever active filter bounds shift
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  return {
    debtorsList: paginatedList,
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
  };
}
