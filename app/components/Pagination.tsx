import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalCount === 0) return null;

  const sizeOptions = [5, 10, 20, 50, 100];

  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;
    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) end = 4;
      if (currentPage >= totalPages - 1) start = totalPages - 3;

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t border-zinc-100 dark:border-zinc-800/50 mt-4">
      {/* LEFT: Metadata and Size Selector */}
      <div className="flex items-center gap-4 order-2 sm:order-1">
        <p className="text-xs font-medium text-zinc-500">
          Showing{" "}
          <span className="text-zinc-900 dark:text-zinc-200">
            {Math.min((currentPage - 1) * pageSize + 1, totalCount)}
          </span>{" "}
          to{" "}
          <span className="text-zinc-900 dark:text-zinc-200">
            {Math.min(currentPage * pageSize, totalCount)}
          </span>{" "}
          of{" "}
          <span className="text-zinc-900 dark:text-zinc-200">{totalCount}</span>
        </p>

        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg px-2 py-1 text-[11px] font-bold outline-none cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      {/* CENTER: Page Numbers */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {getPageNumbers().map((p, i) =>
          typeof p === "string" ? (
            <div
              key={`dots-${i}`}
              className="w-8 flex justify-center text-zinc-400"
            >
              <MoreHorizontal size={14} />
            </div>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                currentPage === p
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>

      {/* RIGHT: Navigation Buttons */}
      <div className="flex items-center gap-2 order-3">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          <ChevronLeft size={14} />
          Prev
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
