"use client";

import React from "react";
import { Settings, CheckSquare, Square, Download, Building2, Users, Heart, UserCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ReportType, ExportFormat, ColumnDefinition } from "./types";

interface CustomReportBuilderProps {
  reportType: ReportType;
  setReportType: (type: ReportType) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  columns: ColumnDefinition[];
  selectedColumns: string[];
  onToggleColumn: (colId: string) => void;
  onToggleAllColumns: () => void;
  onExport: () => void;
}

export function CustomReportBuilder({
  reportType,
  setReportType,
  statusFilter,
  setStatusFilter,
  exportFormat,
  setExportFormat,
  columns,
  selectedColumns,
  onToggleColumn,
  onToggleAllColumns,
  onExport
}: CustomReportBuilderProps) {
  return (
    <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white shadow-sm rounded-xl">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4 text-left">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center border border-teal-100 dark:border-teal-900/30 text-teal-600 dark:text-teal-400">
            <Settings className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold tracking-wide">Custom Report Builder</CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Build customized CSV/Excel sheets dynamically with column controls and live previewing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* 1. Choose Report Type */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-medium text-muted-foreground">1. Choose Report Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: "schools", label: "Schools", icon: <Building2 className="size-4" /> },
              { id: "students", label: "Students", icon: <Users className="size-4" /> },
              { id: "parents", label: "Parents", icon: <Heart className="size-4" /> },
              { id: "users", label: "Users", icon: <UserCheck className="size-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReportType(tab.id as ReportType)}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  reportType === tab.id
                    ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                    : "bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Select Fields / Columns */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-muted-foreground">2. Select Fields / Columns</label>
            <button 
              type="button"
              onClick={onToggleAllColumns}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              {selectedColumns.length === columns.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-4 bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl">
            {columns.map(col => {
              const isChecked = selectedColumns.includes(col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => onToggleColumn(col.id)}
                  className="flex items-center gap-3 text-left py-1.5 px-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  {isChecked ? (
                    <CheckSquare className="size-4 shrink-0 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Square className="size-4 shrink-0 text-zinc-300 dark:text-zinc-700" />
                  )}
                  <span className="text-xs font-medium select-none">{col.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Filters & Format */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-left">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              {reportType === "schools" && (
                <>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option value="csv">CSV Spreadsheet</option>
              <option value="excel">Excel Workbook</option>
              <option value="pdf">Acrobat PDF</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onExport}
            className="h-10 w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-teal-100 dark:shadow-none active:scale-[0.98]"
          >
            <Download className="size-4" />
            Export File
          </button>
        </div>

      </CardContent>
    </Card>
  );
}
