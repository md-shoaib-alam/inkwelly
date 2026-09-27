"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ColumnDefinition } from "./types";

interface LiveReportPreviewProps {
  columns: ColumnDefinition[];
  selectedColumns: string[];
  data: any[];
  isLoading: boolean;
}

export function LiveReportPreview({
  columns,
  selectedColumns,
  data,
  isLoading
}: LiveReportPreviewProps) {
  return (
    <div className="space-y-3 pt-2 text-left">
      <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
        <label className="text-xs font-medium text-muted-foreground">Live Report Preview (Top 5 Matches)</label>
        <Badge className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-2 py-0.5 rounded-full uppercase">
          {data.length} records matched
        </Badge>
      </div>

      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-72">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-950 sticky top-0">
            <tr>
              {columns
                .filter(col => selectedColumns.includes(col.id))
                .map(col => (
                  <th key={col.id} className="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider">
                    {col.label}
                  </th>
                ))}
              {selectedColumns.length === 0 && (
                <th className="px-4 py-3 text-center text-zinc-400">No columns selected</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900/10">
            {isLoading ? (
              <tr>
                <td colSpan={selectedColumns.length || 1} className="px-4 py-8 text-center text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-teal-600" />
                    <span>Loading live system records...</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.slice(0, 5).map((row: any, rIdx) => (
                <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  {columns
                    .filter(col => selectedColumns.includes(col.id))
                    .map(col => {
                      const val = row[col.id];
                      return (
                        <td key={col.id} className="px-4 py-3 whitespace-nowrap text-zinc-800 dark:text-zinc-200 font-medium">
                          {col.id === "status" ? (
                            <Badge className={`text-xs h-5 font-medium px-2 ${
                              val === "Active" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30" :
                              val === "Inactive" ? "bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800" :
                              val === "Trial" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30" :
                              "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30"
                            }`}>
                              {val}
                            </Badge>
                          ) : String(val ?? "N/A")}
                        </td>
                      );
                    })}
                </tr>
              ))
            )}
            {!isLoading && data.length === 0 && (
              <tr>
                <td 
                  colSpan={selectedColumns.length || 1} 
                  className="px-4 py-6 text-center text-zinc-500 font-medium bg-zinc-50/20"
                >
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
