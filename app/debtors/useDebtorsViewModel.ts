import { useState, useEffect, useMemo } from "react";
import { useSalesViewModel } from "../sales/useSalesViewModel";

export function useDebtorsViewModel() {
  // Leverage your existing core business logic methods
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

  // Filter down to only sales that have outstanding arrears balance
  const debtorsList = useMemo(() => {
    return salesList.filter((sale) => {
      const remainingBalance = sale.total_amount - sale.amount_paid;
      const matchesDebt = remainingBalance > 0;

      if (!matchesDebt) return false;

      // Local UI fallback filtering if the endpoint does not support composite searches natively
      if (searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase();
        const clientMatch = sale.customer_name
          ?.toLowerCase()
          .includes(normalizedSearch);
        const summaryMatch = sale.items_summary
          ?.toLowerCase()
          .includes(normalizedSearch);
        return clientMatch || summaryMatch;
      }

      return true;
    });
  }, [salesList, searchTerm]);

  // Derived Pagination Metas
  const totalCount = debtorsList.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const paginatedDebtorsList = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return debtorsList.slice(startIndex, startIndex + pageSize);
  }, [debtorsList, currentPage, pageSize]);

  // Reset page position index when queries evolve
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  return {
    debtorsList: paginatedDebtorsList,
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
  };
}
