"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, GraduationCap, IndianRupee, TrendingUp } from "lucide-react";

// Sub-components
import { AttendanceReport } from "./reports/AttendanceReport";
import { AcademicReport } from "./reports/AcademicReport";
import { FeeReport } from "./reports/FeeReport";

export function AdminReports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="size-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Administrative Reports
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Comprehensive analytics across all school departments
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl h-auto flex-nowrap w-fit">
            <TabsTrigger
              value="attendance"
              className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all"
            >
              <TrendingUp className="size-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger
              value="academic"
              className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all"
            >
              <GraduationCap className="size-4 mr-2" />
              Academic
            </TabsTrigger>
            <TabsTrigger
              value="fees"
              className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all"
            >
              <IndianRupee className="size-4 mr-2" />
              Finances
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="attendance" className="space-y-6 outline-none">
          <AttendanceReport />
        </TabsContent>

        <TabsContent value="academic" className="space-y-6 outline-none">
          <AcademicReport />
        </TabsContent>

        <TabsContent value="fees" className="space-y-6 outline-none">
          <FeeReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
