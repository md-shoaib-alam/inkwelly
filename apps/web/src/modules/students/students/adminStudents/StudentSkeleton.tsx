"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function StudentSkeleton() {
  return (
    <div className="overflow-x-auto px-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 sm:w-32 pl-3 pr-4 sm:pr-8"><Skeleton className="h-4 w-12" /></TableHead>
            <TableHead className="pl-2 sm:pl-4"><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="w-24 text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(8)].map((_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-3 pr-4 sm:pr-8"><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell className="pl-2 sm:pl-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20 md:hidden" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
