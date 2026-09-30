"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ClipboardCheck,
  Calendar,
  Building2,
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";

type ReportTab = "eligibility" | "monthly" | "udise" | "raw";

interface EligibilityRecord {
  id: string;
  admissionNo: string;
  studentName: string;
  className: string;
  present: number;
  workingDays: number;
  percentage: number;
  status: "ELIGIBLE" | "NOT ELIGIBLE";
}

interface EligibilitySummary {
  totalStudents: number;
  belowThreshold: number;
  averagePercentage: number;
}

interface ClassOption {
  id: string;
  name: string;
  section: string;
}

import {
  getSessionMonthsAndPresets,
  type SessionMonthOption,
  type QuickFillPreset,
} from "./utils/session-months";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export function AdminStudentAttendanceReports() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Tab Sync with URL (?tab=register / ?tab=udise / ?tab=raw / default eligibility)
  const tabParam = searchParams?.get("tab");
  const activeTab: ReportTab = useMemo(() => {
    if (tabParam === "register" || tabParam === "monthly") return "monthly";
    if (tabParam === "udise") return "udise";
    if (tabParam === "raw") return "raw";
    return "eligibility";
  }, [tabParam]);

  const handleTabChange = (tab: ReportTab) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (tab === "eligibility") {
      params.delete("tab");
    } else if (tab === "monthly") {
      params.set("tab", "register");
    } else if (tab === "udise") {
      params.set("tab", "udise");
    } else if (tab === "raw") {
      params.set("tab", "raw");
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`);
  };

  // Active academic year from routing / tenant context
  const { year: activeYear, yearSlug } = useActiveAcademicYear();

  // Dynamic session months & presets based on active session
  const { sessionMonths, quickFillPresets } = useMemo(() => {
    return getSessionMonthsAndPresets(activeYear, yearSlug, pathname);
  }, [activeYear, yearSlug, pathname]);

  // Determine active default month in this session
  const defaultSessionMonth = useMemo(() => {
    const param = searchParams?.get("month");
    if (param && sessionMonths.some((m) => m.value === param)) {
      return param;
    }
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (sessionMonths.some((m) => m.value === currentMonthKey)) {
      return currentMonthKey;
    }
    if (sessionMonths.some((m) => m.value === "2026-09")) {
      return "2026-09";
    }
    return sessionMonths[0]?.value || "2026-09";
  }, [searchParams, sessionMonths]);

  // Real Classes loaded from DB
  const [classes, setClasses] = useState<ClassOption[]>([]);

  // 1. Eligibility State
  const [eligibilityClassId, setEligibilityClassId] = useState<string>("all");
  const [threshold, setThreshold] = useState<number>(75);
  const [asOnDate, setAsOnDate] = useState<string>("2026-09-30");
  const [isLoadingEligibility, setIsLoadingEligibility] = useState<boolean>(false);
  const [summary, setSummary] = useState<EligibilitySummary | null>(null);
  const [records, setRecords] = useState<EligibilityRecord[]>([]);
  const [hasRunPreview, setHasRunPreview] = useState<boolean>(false);
  const [isExportingEligibilityExcel, setIsExportingEligibilityExcel] = useState<boolean>(false);
  const [isExportingEligibilityPdf, setIsExportingEligibilityPdf] = useState<boolean>(false);

  // 2. Monthly Register State
  const [registerClassId, setRegisterClassId] = useState<string>("");
  const [registerMonth, setRegisterMonth] = useState<string>(defaultSessionMonth);

  // Keep registerMonth synced if session or months change
  useEffect(() => {
    if (sessionMonths.length === 0) return;
    const exists = sessionMonths.some((m) => m.value === registerMonth);
    if (!exists) {
      setRegisterMonth(defaultSessionMonth);
    }
  }, [sessionMonths, registerMonth, defaultSessionMonth]);
  const [isExportingRegister, setIsExportingRegister] = useState<boolean>(false);
  const [isExportingRegisterPdf, setIsExportingRegisterPdf] = useState<boolean>(false);

  // 3. UDISE+ State
  const [udiseFrom, setUdiseFrom] = useState<string>("2026-09-01");
  const [udiseTo, setUdiseTo] = useState<string>("2026-09-29");
  const [udiseClassId, setUdiseClassId] = useState<string>("all");
  const [isExportingUdise, setIsExportingUdise] = useState<boolean>(false);

  // 4. Raw Export State
  const [rawFrom, setRawFrom] = useState<string>("2026-09-01");
  const [rawTo, setRawTo] = useState<string>("2026-09-29");
  const [rawClassId, setRawClassId] = useState<string>("all");
  const [isExportingRaw, setIsExportingRaw] = useState<boolean>(false);

  // Load Real Classes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch("/api/classes?mode=min");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.items || [];
          if (mounted && list.length > 0) {
            setClasses(list);
            setRegisterClassId(list[0]?.id || "");
          }
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Eligibility from Real Backend on Preview
  const fetchEligibilityReport = useCallback(async () => {
    setIsLoadingEligibility(true);
    setHasRunPreview(true);
    try {
      const url = `/api/attendance/reports/eligibility?classId=${encodeURIComponent(
        eligibilityClassId
      )}&threshold=${threshold}&asOn=${encodeURIComponent(asOnDate)}`;
      const res = await apiFetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load eligibility report");
      }
      const data = await res.json();
      setSummary(data.summary || { totalStudents: 0, belowThreshold: 0, averagePercentage: 0 });
      setRecords(data.records || []);
    } catch (err: any) {
      toast.error(err.message || "Could not generate report");
      setSummary({ totalStudents: 0, belowThreshold: 0, averagePercentage: 0 });
      setRecords([]);
    } finally {
      setIsLoadingEligibility(false);
    }
  }, [eligibilityClassId, threshold, asOnDate]);

  // Helper to compute default class label for filenames
  const getSelectedClassLabel = useCallback(() => {
    if (!eligibilityClassId || eligibilityClassId === "all") {
      return "All_classes";
    }
    const found = classes.find((c) => c.id === eligibilityClassId);
    if (!found) return "All_classes";
    const formatted =
      found.name.toLowerCase().startsWith("class") || found.name.toLowerCase().startsWith("grade")
        ? `${found.name}_${found.section}`
        : `Class_${found.name}_${found.section}`;
    return formatted.replace(/[^a-zA-Z0-9_-]/g, "_");
  }, [eligibilityClassId, classes]);

  // Eligibility Server-Side Excel (.xlsx) Download
  const handleDownloadEligibilityExcel = async () => {
    setIsExportingEligibilityExcel(true);
    try {
      const classLabel = getSelectedClassLabel();
      const defaultFilename = `eligibility_${classLabel}_${asOnDate}.xlsx`;

      const url = `/api/attendance/reports/eligibility/excel?classId=${encodeURIComponent(
        eligibilityClassId
      )}&threshold=${threshold}&asOn=${encodeURIComponent(asOnDate)}`;

      const res = await apiFetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate Excel report");
      }

      let filename = defaultFilename;
      const disposition = res.headers.get("content-disposition");
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      downloadBlob(blob, filename);
      toast.success("Eligibility Excel report downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to download eligibility Excel report");
    } finally {
      setIsExportingEligibilityExcel(false);
    }
  };

  // Eligibility Server-Side PDF (Playwright) Download
  const handleDownloadEligibilityPdf = async () => {
    setIsExportingEligibilityPdf(true);
    try {
      const classLabel = getSelectedClassLabel();
      const defaultFilename = `eligibility_${classLabel}_${asOnDate}.pdf`;

      const url = `/api/attendance/reports/eligibility/pdf?classId=${encodeURIComponent(
        eligibilityClassId
      )}&threshold=${threshold}&asOn=${encodeURIComponent(asOnDate)}`;

      const res = await apiFetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate PDF report");
      }

      let filename = defaultFilename;
      const disposition = res.headers.get("content-disposition");
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      downloadBlob(blob, filename);
      toast.success("Eligibility PDF report downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to download eligibility PDF report");
    } finally {
      setIsExportingEligibilityPdf(false);
    }
  };

  // Monthly Register Server-Side Excel (.xlsx) Download
  const handleDownloadRegisterExcel = async () => {
    if (!registerClassId) {
      toast.error("Please select a class for the register");
      return;
    }
    setIsExportingRegister(true);
    try {
      const selectedCls = classes.find((c) => c.id === registerClassId);
      const classLabel = selectedCls
        ? (selectedCls.name.toLowerCase().startsWith("class") || selectedCls.name.toLowerCase().startsWith("grade")
            ? `${selectedCls.name}_${selectedCls.section}`
            : `Class_${selectedCls.name}_${selectedCls.section}`
          ).replace(/[^a-zA-Z0-9_-]/g, "_")
        : "Class";
      const defaultFilename = `monthly_register_${classLabel}_${registerMonth}.xlsx`;

      const url = `/api/attendance/reports/monthly-register/excel?classId=${encodeURIComponent(
        registerClassId
      )}&month=${encodeURIComponent(registerMonth)}`;

      const res = await apiFetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate monthly register Excel");
      }

      let filename = defaultFilename;
      const disposition = res.headers.get("content-disposition");
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      downloadBlob(blob, filename);
      toast.success("Monthly register Excel downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to download monthly register Excel");
    } finally {
      setIsExportingRegister(false);
    }
  };

  // Monthly Register Server-Side PDF (Playwright) Download
  const handleDownloadRegisterPdf = async () => {
    if (!registerClassId) {
      toast.error("Please select a class for the register");
      return;
    }
    setIsExportingRegisterPdf(true);
    try {
      const selectedCls = classes.find((c) => c.id === registerClassId);
      const classLabel = selectedCls
        ? (selectedCls.name.toLowerCase().startsWith("class") || selectedCls.name.toLowerCase().startsWith("grade")
            ? `${selectedCls.name}_${selectedCls.section}`
            : `Class_${selectedCls.name}_${selectedCls.section}`
          ).replace(/[^a-zA-Z0-9_-]/g, "_")
        : "Class";
      const defaultFilename = `monthly_register_${classLabel}_${registerMonth}.pdf`;

      const url = `/api/attendance/reports/monthly-register/pdf?classId=${encodeURIComponent(
        registerClassId
      )}&month=${encodeURIComponent(registerMonth)}`;

      const res = await apiFetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate monthly register PDF");
      }

      let filename = defaultFilename;
      const disposition = res.headers.get("content-disposition");
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      downloadBlob(blob, filename);
      toast.success("Monthly register PDF downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to download monthly register PDF");
    } finally {
      setIsExportingRegisterPdf(false);
    }
  };

  // UDISE+ Excel Download
  const handleDownloadUdiseExcel = async () => {
    setIsExportingUdise(true);
    try {
      const url = `/api/attendance/reports/udise?from=${encodeURIComponent(
        udiseFrom
      )}&to=${encodeURIComponent(udiseTo)}&classId=${encodeURIComponent(udiseClassId)}`;
      const res = await apiFetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to export UDISE+ data");
      }
      const data = await res.json();
      const { cover, records: udiseRecords } = data;

      if (!udiseRecords || udiseRecords.length === 0) {
        toast.error("No records found for the selected date range");
        return;
      }

      const headers = [
        "Admission No",
        "Student Name",
        "Class",
        "Gender",
        "Religion",
        "Social Category (Caste)",
        "RTE",
        "Instructional Days",
        "Present Days",
        "Attendance %",
      ];

      const rows = udiseRecords.map((r: any) => [
        `"${r.admissionNo}"`,
        `"${r.studentName}"`,
        `"${r.className}"`,
        `"${r.gender}"`,
        `"${r.religion}"`,
        `"${r.casteCategory}"`,
        `"${r.isRte}"`,
        r.instructionalDays,
        r.presentDays,
        `"${r.percentage}%"`,
      ]);

      const csv = [
        `"UDISE+ Attendance Submission Report"`,
        `"Period: ${cover?.dateRange || ""}"`,
        `"Total Students: ${cover?.totalStudents || 0} (Boys: ${cover?.boys || 0}, Girls: ${cover?.girls || 0})"`,
        "",
        headers.join(","),
        ...rows.map((row: any[]) => row.join(",")),
      ].join("\n");

      downloadCsv(`UDISE-Attendance-Export-${udiseFrom}-to-${udiseTo}.csv`, csv);
      toast.success("UDISE+ export downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export UDISE+ data");
    } finally {
      setIsExportingUdise(false);
    }
  };

  // Raw Attendance Excel Download
  const handleDownloadRawExcel = async () => {
    setIsExportingRaw(true);
    try {
      const url = `/api/attendance/reports/raw?from=${encodeURIComponent(
        rawFrom
      )}&to=${encodeURIComponent(rawTo)}&classId=${encodeURIComponent(rawClassId)}`;
      const res = await apiFetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to export raw attendance");
      }
      const data = await res.json();
      const rawRecords = data.records || [];

      if (rawRecords.length === 0) {
        toast.error("No attendance records found for this date range");
        return;
      }

      const headers = [
        "Date",
        "Admission No",
        "Roll No",
        "Student Name",
        "Class",
        "Status",
        "Remarks",
      ];
      const rows = rawRecords.map((r: any) => [
        `"${r.date}"`,
        `"${r.admissionNo}"`,
        `"${r.rollNumber}"`,
        `"${r.studentName}"`,
        `"${r.className}"`,
        `"${r.status}"`,
        `"${r.remarks || ""}"`,
      ]);

      const csv = [headers.join(","), ...rows.map((row: any[]) => row.join(","))].join("\n");
      downloadCsv(`Raw-Attendance-Export-${rawFrom}-to-${rawTo}.csv`, csv);
      toast.success("Raw attendance downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export raw records");
    } finally {
      setIsExportingRaw(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
          Attendance reports & exports
        </h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
          Generate the 75% board-eligibility report, the monthly attendance register, the UDISE+ workbook, and raw attendance exports.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200/90 dark:divide-zinc-800">
          {/* Left Navigation: REPORTS */}
          <div className="md:col-span-3 p-5 lg:p-6 space-y-1 bg-white dark:bg-zinc-900">
            <h2 className="px-3 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
              REPORTS
            </h2>

            {/* Tab 1: Eligibility */}
            <button
              type="button"
              onClick={() => handleTabChange("eligibility")}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] transition-all text-left cursor-pointer",
                activeTab === "eligibility"
                  ? "bg-[#D4F7E7] dark:bg-emerald-950/50 text-[#006644] dark:text-emerald-300 font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
              )}
            >
              <div
                className={cn(
                  "size-7 rounded-lg flex items-center justify-center shrink-0",
                  activeTab === "eligibility"
                    ? "bg-[#00875A] text-white"
                    : "border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
                )}
              >
                <ClipboardCheck className="size-4" />
              </div>
              <span>Eligibility</span>
            </button>

            {/* Tab 2: Monthly register */}
            <button
              type="button"
              onClick={() => handleTabChange("monthly")}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] transition-all text-left cursor-pointer",
                activeTab === "monthly"
                  ? "bg-[#D4F7E7] dark:bg-emerald-950/50 text-[#006644] dark:text-emerald-300 font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
              )}
            >
              <div
                className={cn(
                  "size-7 rounded-lg flex items-center justify-center shrink-0",
                  activeTab === "monthly"
                    ? "bg-[#00875A] text-white"
                    : "border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
                )}
              >
                <Calendar className="size-4" />
              </div>
              <span>Monthly register</span>
            </button>

            {/* Tab 3: UDISE+ */}
            <button
              type="button"
              onClick={() => handleTabChange("udise")}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] transition-all text-left cursor-pointer",
                activeTab === "udise"
                  ? "bg-[#D4F7E7] dark:bg-emerald-950/50 text-[#006644] dark:text-emerald-300 font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
              )}
            >
              <div
                className={cn(
                  "size-7 rounded-lg flex items-center justify-center shrink-0",
                  activeTab === "udise"
                    ? "bg-[#00875A] text-white"
                    : "border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
                )}
              >
                <Building2 className="size-4" />
              </div>
              <span>UDISE+</span>
            </button>

            {/* Tab 4: Raw export */}
            <button
              type="button"
              onClick={() => handleTabChange("raw")}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] transition-all text-left cursor-pointer",
                activeTab === "raw"
                  ? "bg-[#D4F7E7] dark:bg-emerald-950/50 text-[#006644] dark:text-emerald-300 font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-medium"
              )}
            >
              <div
                className={cn(
                  "size-7 rounded-lg flex items-center justify-center shrink-0",
                  activeTab === "raw"
                    ? "bg-[#00875A] text-white"
                    : "border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
                )}
              >
                <FileSpreadsheet className="size-4" />
              </div>
              <span>Raw export</span>
            </button>
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-9 p-6 lg:p-8 bg-white dark:bg-zinc-900">
            {/* ──────────────────────────────────────────────────────────── */}
            {/* TAB 1: 75% Board-Eligibility Report */}
            {/* ──────────────────────────────────────────────────────────── */}
            {activeTab === "eligibility" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[17px] font-semibold text-slate-900 dark:text-zinc-50">
                    75% Board-Eligibility Report
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Identify students below the board minimum (75% by default). Counts late as present and half-day as 0.5 each side; approved leaves count as absent.
                  </p>
                </div>

                <div className="space-y-4 max-w-3xl">
                  {/* Field: Class */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div>
                      <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                        Class
                      </label>
                      <span className="text-[12px] text-slate-500 dark:text-zinc-400 block">
                        Leave empty to compute across all classes.
                      </span>
                    </div>
                    <div className="w-full sm:w-[260px]">
                      <select
                        value={eligibilityClassId}
                        onChange={(e) => setEligibilityClassId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      >
                        <option value="all">All classes</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} - {cls.section}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Field: Threshold % */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div>
                      <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                        Threshold %
                      </label>
                      <span className="text-[12px] text-slate-500 dark:text-zinc-400 block">
                        Board minimum. Most CBSE / ICSE boards use 75%.
                      </span>
                    </div>
                    <div className="w-full sm:w-[110px]">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 text-center font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A]"
                      />
                    </div>
                  </div>

                  {/* Field: As on */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div>
                      <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                        As on
                      </label>
                      <span className="text-[12px] text-slate-500 dark:text-zinc-400 block">
                        Computed from session-start to this date.
                      </span>
                    </div>
                    <div className="w-full sm:w-[220px]">
                      <input
                        type="date"
                        value={asOnDate}
                        onChange={(e) => setAsOnDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={fetchEligibilityReport}
                    disabled={isLoadingEligibility}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-zinc-200 text-[13px] font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isLoadingEligibility ? (
                      <Loader2 className="size-4 animate-spin text-slate-500" />
                    ) : (
                      <FileText className="size-4 text-slate-500 dark:text-zinc-400" />
                    )}
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadEligibilityExcel}
                    disabled={isExportingEligibilityExcel}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#00875A] hover:bg-[#00704A] text-white text-[13px] font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isExportingEligibilityExcel ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      <FileSpreadsheet className="size-4 text-white" />
                    )}
                    <span>Download Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadEligibilityPdf}
                    disabled={isExportingEligibilityPdf}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-zinc-200 text-[13px] font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isExportingEligibilityPdf ? (
                      <Loader2 className="size-4 animate-spin text-slate-500" />
                    ) : (
                      <Download className="size-4 text-slate-500 dark:text-zinc-400" />
                    )}
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* Preview Table & Summary: ONLY rendered when user clicks Preview */}
                {hasRunPreview && (
                  <div className="mt-4 rounded-lg border border-slate-200 dark:border-zinc-700/80 overflow-hidden shadow-2xs">
                    {/* Header bar */}
                    {summary && (
                      <div className="px-3 py-2 text-[12px] bg-[#F1F5F9] dark:bg-zinc-800 text-[#475569] dark:text-zinc-400 font-medium">
                        <span>{summary.totalStudents} students</span>
                        <span className="mx-1.5 text-slate-400">·</span>
                        <span className="text-[#DC2626] font-semibold">
                          {summary.belowThreshold} below threshold
                        </span>
                        <span className="mx-1.5 text-slate-400">·</span>
                        <span>Average {summary.averagePercentage}%</span>
                      </div>
                    )}

                    <div className="max-h-[440px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                            <th className="text-left px-3 py-2 font-semibold text-slate-900 dark:text-zinc-100 text-[12.5px] w-12">
                              #
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-900 dark:text-zinc-100 text-[12.5px] whitespace-nowrap">
                              Adm. No.
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-900 dark:text-zinc-100 text-[12.5px]">
                              Student
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-900 dark:text-zinc-100 text-[12.5px] whitespace-nowrap">
                              Class
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-900 dark:text-zinc-100 text-[12.5px] whitespace-nowrap">
                              Present
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-900 dark:text-zinc-100 text-[12.5px] whitespace-nowrap">
                              Working days
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-900 dark:text-zinc-100 text-[12.5px] whitespace-nowrap">
                              %
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-900 dark:text-zinc-100 text-[12.5px] whitespace-nowrap">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingEligibility ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                <Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#00875A]" />
                                Loading real database attendance...
                              </td>
                            </tr>
                          ) : records.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                No records found for the selected criteria.
                              </td>
                            </tr>
                          ) : (
                            records.map((r, idx) => {
                              const isBelow = r.status === "NOT ELIGIBLE";

                              return (
                                <tr
                                  key={r.id || idx}
                                  className={cn(
                                    "transition-colors",
                                    isBelow
                                      ? "bg-[#FEEAEA] dark:bg-red-950/40 hover:bg-[#FCD8D8] dark:hover:bg-red-950/60 text-slate-900 dark:text-zinc-100 border-b border-[#FCD8D8]/50 dark:border-red-950/50"
                                      : "bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-900 dark:text-zinc-100 border-b border-slate-100 dark:border-zinc-800/80"
                                  )}
                                >
                                  {/* # */}
                                  <td className="text-left px-3 py-2 text-slate-800 dark:text-zinc-300 text-[12.5px]">
                                    {idx + 1}
                                  </td>

                                  {/* Adm. No. */}
                                  <td className="text-left px-3 py-2 font-mono text-[12.5px] text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                                    {r.admissionNo}
                                  </td>

                                  {/* Student */}
                                  <td className="text-left px-3 py-2 font-normal text-slate-900 dark:text-zinc-100 text-[12.5px] whitespace-nowrap">
                                    {r.studentName}
                                  </td>

                                  {/* Class */}
                                  <td className="text-left px-3 py-2 whitespace-nowrap text-slate-800 dark:text-zinc-300 text-[12.5px]">
                                    {r.className}
                                  </td>

                                  {/* Present */}
                                  <td className="text-left px-3 py-2 text-slate-800 dark:text-zinc-300 text-[12.5px] whitespace-nowrap">
                                    {r.present}
                                  </td>

                                  {/* Working days */}
                                  <td className="text-left px-3 py-2 text-slate-800 dark:text-zinc-300 text-[12.5px] whitespace-nowrap">
                                    {r.workingDays}
                                  </td>

                                  {/* % */}
                                  <td
                                    className={cn(
                                      "text-left px-3 py-2 font-bold whitespace-nowrap text-[12.5px]",
                                      isBelow
                                        ? "text-[#DC2626] dark:text-red-400"
                                        : "text-[#00875A] dark:text-emerald-400"
                                    )}
                                  >
                                    {r.percentage.toFixed(1)}%
                                  </td>

                                  {/* Status */}
                                  <td className="text-left px-3 py-2 whitespace-nowrap">
                                    <span
                                      className={cn(
                                        "text-[11.5px] font-bold tracking-wide uppercase",
                                        isBelow
                                          ? "text-[#DC2626] dark:text-red-400"
                                          : "text-[#00875A] dark:text-emerald-400"
                                      )}
                                    >
                                      {r.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────── */}
            {/* TAB 2: Monthly Attendance Register */}
            {/* ──────────────────────────────────────────────────────────── */}
            {activeTab === "monthly" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[17px] font-semibold text-slate-900 dark:text-zinc-50">
                    Monthly Attendance Register
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
                    Indian-standard matrix register: rows = students, columns = days 1-31, signed by class teacher and principal.
                  </p>
                </div>

                <div className="space-y-4 max-w-3xl">
                  {/* Field: Class */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div>
                      <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                        Class
                      </label>
                      <span className="text-[12px] text-slate-500 dark:text-zinc-400 block">
                        One class per register.
                      </span>
                    </div>
                    <div className="w-full sm:w-[260px]">
                      <select
                        value={registerClassId}
                        onChange={(e) => setRegisterClassId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      >
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} - {cls.section}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Field: Month */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div>
                      <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                        Month
                      </label>
                    </div>
                    <div className="w-full sm:w-[260px]">
                      <select
                        value={registerMonth}
                        onChange={(e) => setRegisterMonth(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      >
                        {sessionMonths.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleDownloadRegisterExcel}
                    disabled={isExportingRegister}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#00875A] hover:bg-[#00704A] text-white text-[13px] font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isExportingRegister ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      <FileSpreadsheet className="size-4 text-white" />
                    )}
                    <span>Download Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadRegisterPdf}
                    disabled={isExportingRegisterPdf}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-zinc-200 text-[13px] font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isExportingRegisterPdf ? (
                      <Loader2 className="size-4 animate-spin text-slate-500" />
                    ) : (
                      <Download className="size-4 text-slate-500 dark:text-zinc-400" />
                    )}
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* Legend footnote */}
                <div className="pt-3 text-[12px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Legend: P=Present · A=Absent · L=Late · H=Half-Day · LV=Leave · HO=Holiday · WO=Week-Off · — = Unmarked
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────── */}
            {/* TAB 3: UDISE+ Attendance Export */}
            {/* ──────────────────────────────────────────────────────────── */}
            {activeTab === "udise" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[17px] font-semibold text-slate-900 dark:text-zinc-50">
                    UDISE+ Attendance Export
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
                    Three-sheet workbook (cover, student attendance with demographics, class summary) in UDISE+ submission format.
                  </p>
                </div>

                <div className="space-y-4 max-w-3xl">
                  {/* Field: Quick fill */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pt-2">
                    <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block sm:pt-1">
                      Quick fill
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-[500px]">
                      {quickFillPresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setUdiseFrom(preset.from);
                            setUdiseTo(preset.to);
                          }}
                          className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field: From */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                      From
                    </label>
                    <div className="w-full sm:w-[260px]">
                      <input
                        type="date"
                        value={udiseFrom}
                        onChange={(e) => setUdiseFrom(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Field: To */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                      To
                    </label>
                    <div className="w-full sm:w-[260px]">
                      <input
                        type="date"
                        value={udiseTo}
                        onChange={(e) => setUdiseTo(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Field: Class (optional) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                      Class (optional)
                    </label>
                    <div className="w-full sm:w-[260px]">
                      <select
                        value={udiseClassId}
                        onChange={(e) => setUdiseClassId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      >
                        <option value="all">All classes</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} - {cls.section}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleDownloadUdiseExcel}
                    disabled={isExportingUdise}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#00875A] hover:bg-[#00704A] text-white text-[13px] font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isExportingUdise ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      <FileSpreadsheet className="size-4 text-white" />
                    )}
                    <span>Download UDISE+ Excel</span>
                  </button>
                </div>

                {/* Demographic footnote */}
                <div className="pt-2 text-[12px] text-slate-500 dark:text-zinc-400">
                  Demographic columns (religion, caste category, BPL, CWSN, RTE) are populated from student profiles.
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────── */}
            {/* TAB 4: Raw Attendance Export */}
            {/* ──────────────────────────────────────────────────────────── */}
            {activeTab === "raw" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[17px] font-semibold text-slate-900 dark:text-zinc-50">
                    Raw Attendance Export
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
                    Plain row-per-record Excel export of all attendance for a date range. Useful for migrations or external analysis.
                  </p>
                </div>

                <div className="space-y-4 max-w-3xl">
                  {/* Field: Quick fill */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pt-2">
                    <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block sm:pt-1">
                      Quick fill
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-[500px]">
                      {quickFillPresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setRawFrom(preset.from);
                            setRawTo(preset.to);
                          }}
                          className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field: From */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                      From
                    </label>
                    <div className="w-full sm:w-[260px]">
                      <input
                        type="date"
                        value={rawFrom}
                        onChange={(e) => setRawFrom(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Field: To */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                      To
                    </label>
                    <div className="w-full sm:w-[260px]">
                      <input
                        type="date"
                        value={rawTo}
                        onChange={(e) => setRawTo(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Field: Class (optional) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <label className="text-[13.5px] font-medium text-slate-900 dark:text-zinc-100 block">
                      Class (optional)
                    </label>
                    <div className="w-full sm:w-[260px]">
                      <select
                        value={rawClassId}
                        onChange={(e) => setRawClassId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-slate-800 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] cursor-pointer"
                      >
                        <option value="all">All classes</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} - {cls.section}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleDownloadRawExcel}
                    disabled={isExportingRaw}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#00875A] hover:bg-[#00704A] text-white text-[13px] font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isExportingRaw ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      <FileSpreadsheet className="size-4 text-white" />
                    )}
                    <span>Download Excel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminStudentAttendanceReports;
