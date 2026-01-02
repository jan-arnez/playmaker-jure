"use client";

import { useQueryState, parseAsInteger } from 'nuqs';
import { Pagination } from "@/components/pagination";

interface PaginationClientProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

export function PaginationClient({
  currentPage,
  totalPages,
  className,
}: PaginationClientProps) {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(currentPage).withOptions({ shallow: false }));

  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      onPageChange={setPage}
      className={className}
    />
  );
}

