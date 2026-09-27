'use client';

import { TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export function ActiveExamsSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="py-4 pl-1 pr-2">
            <Skeleton className="size-4 rounded" />
          </TableCell>
          <TableCell className="py-4 px-2 text-center">
            <Skeleton className="h-4 w-4 mx-auto rounded" />
          </TableCell>
          <TableCell className="py-4 pl-2 sm:pl-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 sm:w-48 rounded" />
              <Skeleton className="h-3 w-24 sm:w-32 rounded" />
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell py-4">
            <Skeleton className="h-4 w-16 rounded" />
          </TableCell>
          <TableCell className="hidden sm:table-cell py-4">
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="hidden lg:table-cell py-4">
            <Skeleton className="h-4 w-20 rounded" />
          </TableCell>
          <TableCell className="hidden lg:table-cell py-4">
            <Skeleton className="h-4 w-20 rounded" />
          </TableCell>
          <TableCell className="hidden md:table-cell py-4">
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="py-4 text-right">
            <Skeleton className="size-8 rounded-lg ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
