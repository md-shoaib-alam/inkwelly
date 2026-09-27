"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap } from "lucide-react";
import { PromotionRecord } from "./types";
import { statusConfig } from "./utils";

interface GraduationsTableProps {
  graduations: PromotionRecord[];
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch (e) {
    return dateStr;
  }
};

export function GraduationsTable({ graduations }: GraduationsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Graduation History</CardTitle>
        <CardDescription>
          {graduations.length} record{graduations.length !== 1 ? "s" : ""} found
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {graduations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <GraduationCap className="size-10 mb-2 opacity-30" />
            <p className="text-sm">No graduation records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Roll No.</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="hidden md:table-cell">Academic Year</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Graduated On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {graduations.map((grad) => (
                  <TableRow
                    key={grad.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 flex items-center justify-center text-xs font-semibold shrink-0">
                          {grad.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">
                          {grad.studentName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      #{grad.rollNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {grad.fromClassName}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {grad.academicYear}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`${statusConfig.graduated.bg} font-medium`}
                      >
                        {statusConfig.graduated.icon}
                        <span className="ml-1">Graduated</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground" suppressHydrationWarning>
                      {formatDate(grad.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
