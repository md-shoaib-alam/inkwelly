"use client";

import React from "react";
import { FileSpreadsheet, Download, Building2, Users, TrendingUp, IndianRupee, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StandardReportsProps {
  onDownloadReport: (name: string, format: string, records: any[]) => void;
  mockSchools: any[];
  mockStudents: any[];
  mockUsers: any[];
}

export function StandardReports({
  onDownloadReport,
  mockSchools,
  mockStudents,
  mockUsers
}: StandardReportsProps) {
  return (
    <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white shadow-sm rounded-xl">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4 text-left">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center border border-teal-100 dark:border-teal-900/30 text-teal-600 dark:text-teal-400">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold tracking-wide">Standard Reports</CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              One-click pre-configured operational downloads
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {[
          {
            name: "Schools Overview Report",
            desc: "Complete list of all schools with subscription details",
            format: "excel",
            badge: "Excel | 8 records",
            icon: <Building2 className="size-5 text-emerald-600 dark:text-emerald-400" />,
            bg: "bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800",
            data: mockSchools
          },
          {
            name: "Users Report",
            desc: "All registered users across the system with role information",
            format: "csv",
            badge: "CSV | 4 records",
            icon: <Users className="size-5 text-teal-600 dark:text-teal-400" />,
            bg: "bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800",
            data: mockUsers
          },
          {
            name: "Student Enrollment Report",
            desc: "Student count and enrollment trends by school",
            format: "excel",
            badge: "Excel | 5 records",
            icon: <TrendingUp className="size-5 text-amber-600 dark:text-amber-400" />,
            bg: "bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800",
            data: mockStudents
          },
          {
            name: "Revenue Report",
            desc: "Monthly revenue breakdown by subscription tier",
            format: "excel",
            badge: "Excel | 8 records",
            icon: <IndianRupee className="size-5 text-cyan-600 dark:text-cyan-400" />,
            bg: "bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800",
            data: mockSchools.map(s => ({ School: s.name, Plan: s.plan, Monthly_Rate: s.plan.includes("Premium") ? "$499" : s.plan.includes("Enterprise") ? "$999" : "$199" }))
          },
          {
            name: "Monthly Activity Report",
            desc: "Comprehensive activity log for the past month",
            format: "pdf",
            badge: "PDF | 127 records",
            icon: <FileText className="size-5 text-rose-600 dark:text-rose-400" />,
            bg: "bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800",
            data: [
              { Timestamp: "2025-05-23 21:00", User: "Shoaib Alam", Action: "Enabled AI-Grading Feature", Details: "Success" },
              { Timestamp: "2025-05-23 20:45", User: "Admin User", Action: "Seeded School Database", Details: "852 users created" }
            ]
          }
        ].map((report, idx) => (
          <div 
            key={report.name}
            className={`p-3.5 rounded-xl flex items-center justify-between transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60 ${report.bg}`}
          >
            <div className="flex items-start gap-3 text-left">
              <div className="size-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                {report.icon}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">{report.name}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 max-w-[200px] md:max-w-xs">{report.desc}</p>
                
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium px-1.5 py-0.5 rounded-full uppercase">
                    {report.format}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {report.badge.split("|")[1]}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => onDownloadReport(report.name, report.format, report.data)}
              className="flex items-center gap-1 text-xs font-medium py-1.5 px-3 bg-zinc-100 dark:bg-teal-950/40 hover:bg-teal-600 dark:hover:bg-teal-600 border border-zinc-200 dark:border-teal-900 hover:border-teal-500 text-zinc-700 dark:text-teal-400 hover:text-white dark:hover:text-white cursor-pointer rounded-lg transition-all shrink-0"
            >
              <Download className="size-3" />
              Get
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
