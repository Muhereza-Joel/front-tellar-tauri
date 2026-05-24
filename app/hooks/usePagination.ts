import { useState, useMemo } from "react";

interface UsePaginationProps<T> {
  data?: T[]; // make optional, default to []
  initialPageSize?: number; // default handled inside hook
  searchKeys?: (keyof T)[]; // make optional, default to []
}

export function usePagination<T>({
  data = [], // defensive default
  initialPageSize = 5, // safe default
  searchKeys = [], // defensive default
}: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Filter the data based on the searchTerm
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const lowerSearch = searchTerm.toLowerCase();

    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item?.[key];
        return (
          value !== undefined &&
          value !== null &&
          String(value).toLowerCase().includes(lowerSearch)
        );
      }),
    );
  }, [data, searchTerm, searchKeys]);

  // 2. Calculate counts based on FILTERED data
  const totalCount = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // 3. Slice the FILTERED data for the current page
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, pageSize]);

  // 4. Handle search changes (reset to page 1)
  const handleSearch = (term: string) => {
    setSearchTerm(term ?? ""); // defensive against null/undefined
    setCurrentPage(1);
  };

  // 5. Handle page size changes safely
  const handlePageSizeChange = (newSize: number) => {
    const safeSize =
      Number.isFinite(newSize) && newSize > 0 ? newSize : initialPageSize;
    setPageSize(safeSize);
    setCurrentPage(1);
  };

  // 6. Fix for data deletion or filtering results shrinking
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  return {
    paginatedData,
    searchTerm,
    setSearchTerm: handleSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    totalCount,
  };
}
