import { useState, useMemo } from "react";

interface UsePaginationProps<T> {
  data: T[];
  initialPageSize?: number;
  // We define which keys of the object we want to search through
  searchKeys: (keyof T)[];
}

export function usePagination<T>({
  data,
  initialPageSize = 5,
  searchKeys,
}: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. First, Filter the data based on the searchTerm
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const lowerSearch = searchTerm.toLowerCase();

    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(lowerSearch);
      }),
    );
  }, [data, searchTerm, searchKeys]);

  // 2. Calculate counts based on FILTERED data, not raw data
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
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // 5. Handle page size changes safely
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // 6. Fix for data deletion or filtering results shrinking
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  return {
    paginatedData,
    searchTerm,
    setSearchTerm: handleSearch, // Use the wrapper to reset page 1
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    totalCount,
  };
}
