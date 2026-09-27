"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";

interface AttendanceTableProps {
  selectedClass: string;
  classes: any[];
  search: string;
  setSearch: (v: string) => void;
  loading: boolean;
  records: any[];
  isHistoryMode: boolean;
  statusConfig: any;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  onViewProfile: (record: any) => void;
}

export function AttendanceTable({
  selectedClass,
  classes,
  search,
  setSearch,
  loading,
  records,
  isHistoryMode,
  statusConfig,
  totalPages,
  totalItems,
  currentPage,
  onPageChange,
  onViewProfile,
}: AttendanceTableProps) {
  return (
    <>
      <Card className="shadow-lg border-zinc-100 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-bold">
              Students List
            </CardTitle>
            <CardDescription>
              {selectedClass === "all"
                ? "Showing attendance for all school students"
                : `Showing attendance records for Class ${classes.find((c) => c.id === selectedClass)?.name}-${classes.find((c) => c.id === selectedClass)?.section}`}
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input 
              placeholder="Search students…" 
              className="pl-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead className="font-bold pl-6">Student Name</TableHead>
                <TableHead className="font-bold w-[150px]">Class</TableHead>
                {isHistoryMode && (
                  <TableHead className="font-bold w-[150px]">Date</TableHead>
                )}
                <TableHead className="font-bold w-[180px]">Status</TableHead>
                <TableHead className="font-bold w-[120px]">Time</TableHead>
                <TableHead className="text-right font-bold pr-6 w-[140px]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={`att-skel-${i}`}>
                      {Array(5)
                        .fill(0)
                        .map((_, j) => (
                          <TableCell key={`att-skel-cell-${j}`}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isHistoryMode ? 6 : 5}
                    className="h-32 text-center text-zinc-500 italic"
                  >
                    No attendance records found for this selection.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 group transition-colors"
                  >
                    <TableCell className="font-medium pl-6">
                      {record.studentName}
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <Badge
                        variant="outline"
                        className="font-semibold bg-zinc-50 dark:bg-zinc-950"
                      >
                        {record.className}
                      </Badge>
                    </TableCell>
                    {isHistoryMode && (
                      <TableCell className="font-medium w-[150px]" suppressHydrationWarning>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                    )}
                    <TableCell className="w-[180px]">
                      <Badge
                        className={`${statusConfig[record.status]?.bg} border shadow-sm`}
                      >
                        <span className="flex items-center gap-1.5 pt-0.5">
                          {statusConfig[record.status]?.icon}
                          {statusConfig[record.status]?.text}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm w-[120px]" suppressHydrationWarning>
                      {record.createdAt
                        ? new Date(record.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : record.date && record.date.includes("T")
                        ? new Date(record.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "08:30 AM"}
                    </TableCell>
                    <td className="text-right pr-6 w-[140px]">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-semibold"
                        onClick={() => onViewProfile(record)}
                      >
                        View Profile
                      </Button>
                    </td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PAGINATION FOOTER */}
      {!loading && totalPages > 1 && (
        <div className="mt-4 pb-6">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={50}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
