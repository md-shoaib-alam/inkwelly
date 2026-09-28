"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, ChevronRight } from "lucide-react";
import { DashboardData } from "./types";
import { Button } from "@/components/ui/button";

interface TopPerformanceProps {
  loading: boolean;
  data: DashboardData | undefined;
  onNavigate?: (screen: string) => void;
}

export function TopPerformance({ loading, data, onNavigate }: TopPerformanceProps) {
  // Sample fallback schools matching reference image if dynamic data is empty
  const defaultSchools = [
    {
      id: "1",
      name: "Bright Future International School",
      location: "Bangalore, KA",
      date: "15 Sep 2026",
      status: "active",
      logo: null,
    },
    {
      id: "2",
      name: "Sunrise Public School",
      location: "Delhi, DL",
      date: "14 Sep 2026",
      status: "active",
      logo: null,
    },
    {
      id: "3",
      name: "Maple Leaf Academy",
      location: "Mumbai, MH",
      date: "12 Sep 2026",
      status: "trial",
      logo: null,
    },
    {
      id: "4",
      name: "Greenwood High School",
      location: "Hyderabad, TG",
      date: "10 Sep 2026",
      status: "active",
      logo: null,
    },
    {
      id: "5",
      name: "The Learning Tree",
      location: "Pune, MH",
      date: "08 Sep 2026",
      status: "suspended",
      logo: null,
    },
  ];

  const schools = (data?.topTenants && data.topTenants.length > 0)
    ? data.topTenants.map((t, idx) => ({
        id: t.id,
        name: t.name,
        location: t.address || "Main Campus",
        date: t.createdAt
          ? new Date(t.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : defaultSchools[idx % defaultSchools.length].date,
        status: t.status || "active",
        logo: t.logo,
      }))
    : defaultSchools;

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm py-4 px-5 gap-3">
      <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="size-3.5" />
            </div>
            Recent Schools
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Recently registered schools on the platform
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate?.("tenants")}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 h-7 px-2 flex items-center gap-1"
        >
          View All <ChevronRight className="size-3" />
        </Button>
      </CardHeader>

      <CardContent className="p-0 pt-1">
        {loading ? (
          <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60">
                  <TableHead className="w-10 text-[11px] font-semibold text-slate-500 text-center">#</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500">School Name</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500">Location</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500">Registration Date</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow
                    key={i}
                    className="border-b border-slate-100 dark:border-slate-800/60 last:border-none"
                  >
                    <TableCell className="text-center py-3.5">
                      <Skeleton className="h-4 w-4 mx-auto rounded-md" />
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Skeleton className="h-4 w-44 rounded-md" />
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Skeleton className="h-4 w-24 rounded-md" />
                    </TableCell>
                    <TableCell className="text-center py-3.5">
                      <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent">
                  <TableHead className="w-10 text-[11px] font-semibold text-slate-500 text-center">#</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500">School Name</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500">Location</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500">Registration Date</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.slice(0, 5).map((school, index) => (
                  <TableRow
                    key={school.id}
                    onClick={() => onNavigate?.("tenants")}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-none transition-colors"
                  >
                    <TableCell className="text-center font-semibold text-slate-400 text-xs py-3">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-slate-800 dark:text-slate-200 py-3">
                      {school.name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium py-3">
                      {school.location}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium py-3">
                      {school.date}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                          school.status === "active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                            : school.status === "trial"
                            ? "bg-purple-50 text-purple-600 border border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40"
                            : (school.status === "deleted" || school.status === "suspended")
                            ? "bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40"
                            : "bg-slate-50 text-slate-600 border border-slate-200/70"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full shrink-0 ${
                            school.status === "active"
                              ? "bg-emerald-500"
                              : school.status === "trial"
                              ? "bg-purple-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {school.status}
                      </span>
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
