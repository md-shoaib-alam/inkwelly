'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ActiveExamsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function PaginationPages({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];

    // Always include page 1
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always include last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center gap-1">
      {getPageNumbers().map((page, idx) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-muted-foreground text-xs select-none"
            >
              ...
            </span>
          );
        }
        const isCurrent = currentPage === page;
        return (
          <Button
            key={page}
            variant={isCurrent ? 'default' : 'outline'}
            size="icon"
            className={`size-8 text-xs font-semibold rounded-lg transition-colors ${
              isCurrent
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}
    </div>
  );
}

export function ActiveExamsPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: ActiveExamsPaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t border-border/60 gap-3 bg-white dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {startItem}
          </span>
          {' to '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {endItem}
          </span>
          {' of '}
          <span className="font-semibold text-foreground">{totalItems}</span> entries
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-[72px] bg-transparent border-zinc-200 dark:border-zinc-800 text-xs rounded-lg">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="10" className="text-xs">10</SelectItem>
              <SelectItem value="15" className="text-xs">15</SelectItem>
              <SelectItem value="25" className="text-xs">25</SelectItem>
              <SelectItem value="50" className="text-xs">50</SelectItem>
              <SelectItem value="100" className="text-xs">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {totalPages > 1 ? (
          <PaginationPages
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        ) : (
          <Button
            variant="default"
            size="icon"
            className="size-8 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            1
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
