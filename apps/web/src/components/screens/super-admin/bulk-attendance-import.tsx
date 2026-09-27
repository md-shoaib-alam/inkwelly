"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  ClipboardList, 
  Shield,
  Building2, 
  UploadCloud, 
  Calendar, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  FileSpreadsheet, 
  Check, 
  ChevronsUpDown, 
  Clock, 
  Sparkles, 
  CheckSquare, 
  Square, 
  User, 
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Info,
  XCircle,
  FileCheck2,
  Trash2,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  classId: string;
  email?: string;
}

interface ParsedRecord {
  id: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  rollNumber?: string;
  className?: string;
  date: string;
  status: string;
  rawStatus?: string;
  remarks?: string;
  isValid: boolean;
  errors: string[];
}

// Safely parse a date string formatted as "YYYY-MM-DD" into a local Date object.
// This prevents timezone-offset shift issues which usually occur with "new Date(dateString)".
const parseDateString = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
  return new Date(year, month - 1, day);
};

// Safely format a local Date object into a "YYYY-MM-DD" date string.
const formatDateToString = (date?: Date): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function SuperAdminBulkAttendance() {
  const [activeTab, setActiveTab] = useState<string>("upload");

  // School select states
  const [schools, setSchools] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [selectedSchool, setSelectedSchool] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [schoolPopoverOpen, setSchoolPopoverOpen] = useState(false);

  // Students list of selected school
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Tab 1: Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRecord[]>([]);
  const [validatingFile, setValidatingFile] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    skippedCount: number;
    skippedRecords?: Array<{ record: any; reason: string }>;
  } | null>(null);
  const [mobileInstructionsOpen, setMobileInstructionsOpen] = useState(false);

  // Tab 2: Range states
  const [allStudentsMode, setAllStudentsMode] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [rangeStatus, setRangeStatus] = useState<string>("present");
  const [rangeRemarks, setRangeRemarks] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [generatingRange, setGeneratingRange] = useState(false);
  
  // Progress states
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  const startProgressSimulation = (totalRecords: number) => {
    setProgress(0);
    setShowProgress(true);
    
    // Estimate time: base of 1.5s plus ~1.5ms per record, capped between 2s and 12s
    const estimatedDuration = Math.max(2000, Math.min(12000, 1500 + totalRecords * 1.5));
    const intervalTime = 100;
    const totalSteps = estimatedDuration / intervalTime;
    const increment = 90 / totalSteps;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return Math.min(90, prev + increment);
      });
    }, intervalTime);
    
    return timer;
  };

  const completeProgress = (timer: any) => {
    if (timer) clearInterval(timer);
    setProgress(100);
    setTimeout(() => {
      setShowProgress(false);
      setProgress(0);
    }, 1000);
  };

  const failProgress = (timer: any) => {
    if (timer) clearInterval(timer);
    setShowProgress(false);
    setProgress(0);
  };
  
  // Specific Date overrides within selected range
  const [overriddenStatuses, setOverriddenStatuses] = useState<Record<string, string>>({});
  const [overriddenRemarks, setOverriddenRemarks] = useState<Record<string, string>>({});

  // Scroll tracking for custom circular progress ring
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    const totalHeight = element.scrollHeight - element.clientHeight;
    if (totalHeight <= 0) {
      setScrollProgress(0);
      setIsScrolledToBottom(false);
      return;
    }
    const progress = (element.scrollTop / totalHeight) * 100;
    setScrollProgress(progress);
    setIsScrolledToBottom(element.scrollTop + element.clientHeight >= element.scrollHeight - 8);
  };

  // Reset scroll progress when range changes
  useEffect(() => {
    setScrollProgress(0);
    setIsScrolledToBottom(false);
  }, [startDate, endDate]);

  // Reset overrides when date range changes
  useEffect(() => {
    setOverriddenStatuses({});
    setOverriddenRemarks({});
  }, [startDate, endDate]);

  // Fetch active schools
  useEffect(() => {
    async function fetchSchools() {
      setLoadingSchools(true);
      try {
        const res = await api.get('/tenants?limit=1000');
        if (res && res.tenants) {
          setSchools(res.tenants);
        }
      } catch (err: any) {
        toast.error("Failed to load schools: " + err.message);
      } finally {
        setLoadingSchools(false);
      }
    }
    fetchSchools();
  }, []);

  // Fetch students when school changes
  useEffect(() => {
    if (!selectedSchool) {
      setStudents([]);
      setSelectedStudent(null);
      setSelectedClassId("all");
      return;
    }

    async function fetchStudents() {
      setLoadingStudents(true);
      try {
        const res = await apiFetch('/students?mode=min', {
          headers: {
            'x-tenant-id': selectedSchool!.id
          }
        });
        const data = await res.json();
        if (data && data.items) {
          setStudents(data.items);
        }
      } catch (err: any) {
        toast.error("Failed to load students for this school: " + err.message);
      } finally {
        setLoadingStudents(false);
      }
    }
    
    fetchStudents();
    // Reset file / previews when changing school
    setUploadedFile(null);
    setParsedRows([]);
    setImportResult(null);
  }, [selectedSchool]);

  // Filter schools
  const filteredSchools = useMemo(() => {
    return schools.filter(s => 
      s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(schoolSearchQuery.toLowerCase())
    );
  }, [schools, schoolSearchQuery]);

  // Unique classes extracted from students list
  const uniqueClasses = useMemo(() => {
    const classesMap = new Map<string, string>();
    students.forEach(s => {
      if (s.classId && s.className) {
        classesMap.set(s.classId, s.className);
      }
    });
    return Array.from(classesMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  // Filter students by selected class and search query
  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedClassId && selectedClassId !== "all") {
      result = result.filter(s => s.classId === selectedClassId);
    }
    return result.filter(s => 
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (s.className && s.className.toLowerCase().includes(studentSearchQuery.toLowerCase()))
    );
  }, [students, selectedClassId, studentSearchQuery]);

  // Generate Excel template prefilled with student list
  const handleDownloadTemplate = async () => {
    if (!selectedSchool) {
      toast.warning("Please select a school first!");
      return;
    }

    setDownloadingTemplate(true);
    try {
      let rows: any[] = [];

      if (students.length > 0) {
        rows = students.map(s => ({
          "Student ID": s.id,
          "Student Name": s.name,
          "Student Email": s.email || "",
          "Roll Number": s.rollNumber || "",
          "Class Name": s.className || "",
          "Date (YYYY-MM-DD)": new Date().toISOString().split('T')[0],
          "Status (PRESENT/ABSENT)": "PRESENT",
          "Remarks": ""
        }));
      } else {
        // Fallback placeholder row if school has no students yet
        rows = [
          {
            "Student ID": "STU12345",
            "Student Name": "John Doe",
            "Student Email": "johndoe@school.com",
            "Roll Number": "10",
            "Class Name": "Grade 5-A",
            "Date (YYYY-MM-DD)": new Date().toISOString().split('T')[0],
            "Status (PRESENT/ABSENT)": "PRESENT",
            "Remarks": "Regular entry"
          }
        ];
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      
      // Auto-fit column widths
      ws['!cols'] = [
        { wch: 15 }, // Student ID
        { wch: 22 }, // Name
        { wch: 25 }, // Email
        { wch: 12 }, // Roll
        { wch: 15 }, // Class
        { wch: 18 }, // Date
        { wch: 40 }, // Status instructions
        { wch: 18 }  // Remarks
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Sheet");
      
      XLSX.writeFile(wb, `${selectedSchool.name.replace(/[^a-zA-Z0-9]/g, '_')}_attendance_template.xlsx`);
      toast.success("Excel template downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to generate template: " + err.message);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Drag-and-drop dropzone functions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!selectedSchool) {
      toast.warning("Please select a school first!");
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSchool) {
      toast.warning("Please select a school first!");
      return;
    }

    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  // Parse and validate the Excel file
  const processUploadedFile = (file: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      toast.error("Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }

    setUploadedFile(file);
    setValidatingFile(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse sheet to JSON array
        const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (!rawRows || rawRows.length === 0) {
          toast.error("The uploaded spreadsheet is empty.");
          setParsedRows([]);
          setValidatingFile(false);
          return;
        }

        // Validate rows and normalize headers case-insensitively
        const validated: ParsedRecord[] = rawRows.map((row, idx) => {
          const normalized: Record<string, any> = {};
          
          // Map headers case-insensitively, ignore whitespace, dashes, and parentheses
          Object.keys(row).forEach(key => {
            const normKey = key.trim().toLowerCase().replace(/[\s\-_()]/g, '');
            normalized[normKey] = row[key];
          });

          // Extract values using various header synonyms
          const studentId = String(normalized.studentid || normalized.id || "").trim();
          const studentName = String(normalized.studentname || normalized.name || "").trim();
          const studentEmail = String(normalized.studentemail || normalized.email || normalized.emailid || "").trim();
          const rollNumber = String(normalized.rollnumber || normalized.roll || "").trim();
          const className = String(normalized.classname || normalized.class || "").trim();
          const rawDate = normalized.date || normalized.dateyyyymmdd || normalized.attendancedate;
          const rawStatus = String(normalized.status || normalized.attendancestatus || "").trim();
          const remarks = String(normalized.remarks || normalized.remark || normalized.note || "").trim();

          // Resilient Date parsing
          let dateStr = "";
          if (typeof rawDate === 'number') {
            // Excel serial date format
            try {
              const parsedDate = XLSX.SSF.parse_date_code(rawDate);
              const y = parsedDate.y;
              const m = String(parsedDate.m).padStart(2, '0');
              const d = String(parsedDate.d).padStart(2, '0');
              dateStr = `${y}-${m}-${d}`;
            } catch {
              dateStr = String(rawDate);
            }
          } else if (rawDate instanceof Date) {
            dateStr = rawDate.toISOString().split('T')[0];
          } else if (rawDate) {
            dateStr = String(rawDate).trim();
          }

          // Row validation errors accumulator
          const errors: string[] = [];

          // Validate Date format YYYY-MM-DD
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateStr) {
            errors.push("Missing date");
          } else if (!dateRegex.test(dateStr)) {
            errors.push("Invalid date format (must be YYYY-MM-DD)");
          } else {
            const dObj = new Date(dateStr);
            if (isNaN(dObj.getTime())) {
              errors.push("Date is calendar-invalid");
            }
          }

          // Validate Status
          const cleanStatus = rawStatus.toLowerCase();
          let finalStatus = "present";
          const validStatuses = ["present", "absent"];

          if (!rawStatus) {
            errors.push("Missing status");
          } else if (!validStatuses.includes(cleanStatus)) {
            errors.push(`Invalid status value: "${rawStatus}"`);
          } else {
            // Standardize status value for API
            if (cleanStatus === "present") finalStatus = "present";
            else if (cleanStatus === "absent") finalStatus = "absent";
          }

          // Student identification checking
          if (!studentId && !studentEmail && !(rollNumber && className)) {
            errors.push("Insufficient student data. Include Student ID, Email, or Roll + Class.");
          }

          return {
            id: `row-${idx}`,
            studentId: studentId || undefined,
            studentName: studentName || undefined,
            studentEmail: studentEmail || undefined,
            rollNumber: rollNumber || undefined,
            className: className || undefined,
            date: dateStr,
            status: finalStatus,
            rawStatus: rawStatus,
            remarks: remarks || undefined,
            isValid: errors.length === 0,
            errors
          };
        });

        setParsedRows(validated);
        toast.success(`Successfully parsed ${validated.length} rows. Please review preview below.`);
      } catch (err: any) {
        toast.error("Failed to parse sheet: " + err.message);
        setParsedRows([]);
      } finally {
        setValidatingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // POST the valid rows to the API
  const handleConfirmImport = async () => {
    if (!selectedSchool) {
      toast.warning("Select school first.");
      return;
    }

    const validRows = parsedRows.filter(r => r.isValid);

    if (validRows.length === 0) {
      toast.error("There are no valid records to import.");
      return;
    }

    setImportingData(true);
    setImportResult(null);
    const timer = startProgressSimulation(validRows.length);

    try {
      const payload = {
        records: validRows.map(r => ({
          studentId: r.studentId,
          studentEmail: r.studentEmail,
          rollNumber: r.rollNumber,
          className: r.className,
          date: r.date,
          status: r.status,
          remarks: r.remarks
        }))
      };

      const res = await apiFetch('/attendance/bulk-import', {
        method: 'POST',
        headers: {
          'x-tenant-id': selectedSchool.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        completeProgress(timer);
        toast.success(`Bulk import completed! Imported: ${data.importedCount}, Skipped: ${data.skippedCount}`);
        setImportResult(data);
        // Clear current states
        setUploadedFile(null);
        setParsedRows([]);
      } else {
        failProgress(timer);
        toast.error(data.error || "Failed to import attendance data.");
      }
    } catch (err: any) {
      failProgress(timer);
      toast.error("An error occurred during import: " + err.message);
    } finally {
      setImportingData(false);
    }
  };

  // Tab 2: Range computations
  const computedRangeDates = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const dates: { dateStr: string; dayLabel: string; isValid: boolean }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return [];
    }

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const current = new Date(start);

    // Limit range to max 180 days to prevent browser crash / oversized request
    let limit = 0;
    while (current <= end && limit < 180) {
      const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const dateStr = current.toISOString().split('T')[0];
      const isWeekDayChecked = selectedDays.includes(dayOfWeek);

      dates.push({
        dateStr,
        dayLabel: dayLabels[dayOfWeek],
        isValid: isWeekDayChecked
      });

      current.setDate(current.getDate() + 1);
      limit++;
    }

    return dates;
  }, [startDate, endDate, selectedDays]);

  const activeRangeDatesCount = useMemo(() => {
    return computedRangeDates.filter(d => d.isValid).length;
  }, [computedRangeDates]);

  const isRangeTooLarge = useMemo(() => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return false;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 180;
  }, [startDate, endDate]);

  // Trigger live toast alert when selected date range exceeds 180-day limit
  useEffect(() => {
    if (isRangeTooLarge && startDate && endDate) {
      const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      toast.warning(`Date Range Exceeded (Out of Range)`, {
        description: `Selected range is ${diffDays} days. The system safety limit is 180 days (6 months). Please shorten your selection.`
      });
    }
  }, [isRangeTooLarge, startDate, endDate]);

  // Execute Student Date Range Bulk Entry
  const handleRangeImport = async () => {
    if (!selectedSchool) {
      toast.warning("Please select a school first.");
      return;
    }

    if (!startDate || !endDate) {
      toast.warning("Please select both Start Date and End Date.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be before start date.");
      return;
    }

    if (!allStudentsMode && !selectedStudent) {
      toast.warning("Please select a specific student or apply to all students.");
      return;
    }

    const validDates = computedRangeDates.filter(d => d.isValid).map(d => d.dateStr);

    if (validDates.length === 0) {
      toast.error("No active days selected in the range based on your day filters.");
      return;
    }

    setGeneratingRange(true);
    const targetStudents = allStudentsMode ? students : [selectedStudent!];
    const totalRecords = targetStudents.length * validDates.length;
    const timer = startProgressSimulation(totalRecords);

    try {
      const recordsToPost: any[] = [];

      if (targetStudents.length === 0) {
        toast.error("No students found to apply attendance to.");
        setGeneratingRange(false);
        failProgress(timer);
        return;
      }

      // Construct records list
      for (const student of targetStudents) {
        for (const date of validDates) {
          const status = overriddenStatuses[date] || rangeStatus;
          const remarks = overriddenRemarks[date] || rangeRemarks;
          recordsToPost.push({
            studentId: student.id,
            studentEmail: student.email || undefined,
            rollNumber: student.rollNumber || undefined,
            className: student.className || undefined,
            date: date,
            status: status,
            remarks: remarks || undefined
          });
        }
      }

      const payload = {
        records: recordsToPost
      };

      const res = await apiFetch('/attendance/bulk-import', {
        method: 'POST',
        headers: {
          'x-tenant-id': selectedSchool.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        completeProgress(timer);
        toast.success(`Range entry complete! ${data.importedCount} records successfully written.`);
        setImportResult(data);
        // Reset states
        setStartDate("");
        setEndDate("");
        setRangeRemarks("");
      } else {
        failProgress(timer);
        toast.error(data.error || "Failed to import range records.");
      }
    } catch (err: any) {
      failProgress(timer);
      toast.error("Error submitting range: " + err.message);
    } finally {
      setGeneratingRange(false);
    }
  };

  const handleToggleDay = (dayValue: number) => {
    setSelectedDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue) 
        : [...prev, dayValue]
    );
  };

  const AVATAR_COLORS = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  ];

  const getStatusBadge = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
            Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
            <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
            Absent
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50">
            <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
            Late
          </span>
        );
      case "half_day":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50">
            <span className="size-1.5 rounded-full bg-sky-500 shrink-0" />
            Half Day
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {status || "Unknown"}
          </span>
        );
    }
  };

  const DAYS_OF_WEEK = [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
    { label: "Sun", value: 0 },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* 1. Emerald Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/30 dark:from-slate-900 dark:via-emerald-950/30 dark:to-slate-900 border border-emerald-100/90 dark:border-emerald-900/40 px-4.5 sm:px-6 py-3 sm:py-3.5 shadow-2xs">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-1/4 w-80 h-48 bg-emerald-400/15 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 right-10 w-48 h-36 bg-teal-300/15 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Content: Compact Left Headline & Right 3D Graphic */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Copy */}
          <div className="max-w-md min-w-0">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
              <FileSpreadsheet className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>Bulk Automation</span>
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight mt-1 sm:mt-1.5">
              Fast. Accurate. Bulk Records.
            </h3>

            <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 leading-snug font-normal">
              Batch import spreadsheet templates or automate multi-date attendance entries.
            </p>
          </div>

          {/* Right 3D Illustration */}
          <div className="relative flex items-center justify-end shrink-0 pr-0.5 sm:pr-2">
            <div className="relative h-14 sm:h-20 md:h-22 aspect-[16/9] overflow-hidden select-none">
              <Image
                src="/assets/super-admin/blukattendcetop.avif"
                alt="Bulk Attendance"
                fill
                priority
                className="object-contain scale-125 drop-shadow-md"
                sizes="(max-width: 640px) 110px, (max-width: 768px) 160px, 200px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Header with Integrated School Context Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="hidden sm:flex items-center gap-2.5 min-w-0">
          <div className="size-8.5 sm:size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100/80 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ClipboardList className="size-4 sm:size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight truncate">
                Bulk Attendance Import
              </h2>
              <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
                <Shield className="size-2.5 text-emerald-600" />
                Platform
              </span>
            </div>
            <p className="hidden sm:block text-[11px] sm:text-xs text-muted-foreground mt-0.5 font-normal truncate">
              {selectedSchool 
                ? `Active School: ${selectedSchool.name}` 
                : "Select a school context to begin bulk import"}
            </p>
          </div>
        </div>

        {/* Integrated School Selector Dropdown */}
        <div className="w-full sm:w-auto shrink-0">
          <div className="sm:hidden flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">
            <span>School Context</span>
            {selectedSchool && (
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            )}
          </div>
          <Popover open={schoolPopoverOpen} onOpenChange={setSchoolPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                role="combobox" 
                aria-expanded={schoolPopoverOpen}
                className="w-full sm:w-[260px] h-11 sm:h-9 text-xs rounded-xl justify-between cursor-pointer capitalize bg-card border-border px-3 shadow-2xs hover:bg-muted/50 transition-all group"
              >
                <span className="flex items-center gap-2.5 truncate">
                  <div className="size-7 sm:size-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="size-3.5" />
                  </div>
                  <span className={`truncate ${selectedSchool ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                    {selectedSchool ? selectedSchool.name : "Select School..."}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {!selectedSchool && (
                    <span className="sm:hidden text-[10px] font-medium text-emerald-700 bg-emerald-100/70 dark:text-emerald-300 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
                      Choose
                    </span>
                  )}
                  <ChevronsUpDown className="size-3.5 opacity-50 text-muted-foreground" />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[320px] max-w-sm p-0 border border-border bg-card shadow-xl rounded-xl" align="start" side="bottom" sideOffset={4}>
              <div className="flex items-center border-b px-3 border-border">
                <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                <Input 
                  placeholder="Search schools..." 
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  className="flex h-9 w-full bg-transparent py-2 text-xs outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                />
              </div>
              <ScrollArea className="h-56 p-1">
                {loadingSchools ? (
                  <div className="flex items-center justify-center p-4 text-xs text-muted-foreground gap-2">
                    <RefreshCw className="size-3.5 animate-spin text-emerald-600" /> Loading schools...
                  </div>
                ) : filteredSchools.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground text-center">No schools found matching search.</div>
                ) : (
                  filteredSchools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => {
                        setSelectedSchool(school);
                        setSchoolPopoverOpen(false);
                        setSchoolSearchQuery("");
                      }}
                      className="flex items-center justify-between w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="font-medium text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{school.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{school.slug}</span>
                      </div>
                      {selectedSchool?.id === school.id && (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Success/Import Result Banners */}
      <AnimatePresence>
        {importResult && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <Card className="border-none bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 relative overflow-hidden rounded-xl">
              <div className="absolute top-0 right-0 p-3">
                <Button variant="ghost" size="sm" onClick={() => setImportResult(null)} className="text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 h-7 w-7 p-0">✕</Button>
              </div>
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Import Summary Completed</CardTitle>
                  <CardDescription className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                    Attendance records parsed and updated successfully inside the database.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-2">
                    <FileCheck2 className="size-3.5" />
                    Successfully Processed: <span className="text-base font-extrabold">{importResult.importedCount}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-zinc-500/10 dark:bg-zinc-500/20 border border-zinc-500/30 flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <XCircle className="size-3.5 text-muted-foreground" />
                    Skipped/Ignored: <span className="text-base font-extrabold">{importResult.skippedCount}</span>
                  </div>
                </div>

                {importResult.skippedRecords && importResult.skippedRecords.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5" /> Skip Rationale Details
                    </h4>
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-white/50 dark:bg-black/30 rounded-lg p-2 text-xs font-mono">
                      {importResult.skippedRecords.map((item, idx) => (
                        <div key={idx} className="flex justify-between border-b border-black/5 dark:border-white/5 py-1 last:border-none">
                          <span className="text-zinc-600 dark:text-zinc-400 truncate pr-4">
                            Row {idx + 1}: Name: {item.record?.studentName || 'N/A'} | Date: {item.record?.date || 'N/A'}
                          </span>
                          <span className="text-rose-500 font-semibold shrink-0">{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedSchool ? (
        <Card className="rounded-2xl border-dashed border-2 py-14 text-center shadow-none bg-card">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="size-12 rounded-full bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center mx-auto text-teal-600 dark:text-teal-400">
              <Building2 className="size-6" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base font-semibold text-foreground">No Active School Selected</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Before uploading spreadsheets or generating date ranges, you must associate a school context using the selector above.
              </p>
            </div>
            <Button onClick={() => setSchoolPopoverOpen(true)} className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5 cursor-pointer mt-1 shadow-xs">
              <Search className="size-3.5" /> Select School Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-5">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/60 p-1 rounded-xl h-10 border border-border/50">
            <TabsTrigger value="upload" className="rounded-lg cursor-pointer flex items-center justify-center gap-2 h-8 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
              <FileSpreadsheet className="size-3.5" /> Spreadsheet Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="range" className="rounded-lg cursor-pointer flex items-center justify-center gap-2 h-8 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
              <CalendarDays className="size-3.5" /> Date Range Bulk Entry
            </TabsTrigger>
          </TabsList>

          {/* Sub-Tab 1: Spreadsheet Bulk Upload */}
          <TabsContent value="upload" className="space-y-5 animate-in fade-in-30 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Instructions Panel */}
              <div className="lg:col-span-1 space-y-4">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs bg-card overflow-hidden">
                  <div 
                    onClick={() => setMobileInstructionsOpen((prev) => !prev)}
                    className={`px-3 py-2 sm:px-4 sm:py-3 cursor-pointer lg:cursor-default flex items-center justify-between select-none transition-colors hover:bg-slate-500/[0.03] dark:hover:bg-slate-500/[0.06] lg:hover:bg-transparent ${
                      mobileInstructionsOpen ? "border-b border-border/40" : "lg:border-b lg:border-border/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-6.5 sm:size-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                        <Sparkles className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                          Upload Instructions
                        </h4>
                        <p className="hidden lg:block text-xs text-muted-foreground mt-0.5">
                          Follow these specifications for seamless processing.
                        </p>
                      </div>
                    </div>

                    <div className="lg:hidden flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/50 dark:border-teal-800/30 text-teal-700 dark:text-teal-300 text-[11px] font-semibold shrink-0 ml-2">
                      <span>{mobileInstructionsOpen ? "Hide" : "Details"}</span>
                      <ChevronDown className={`size-3 transition-transform duration-200 ${mobileInstructionsOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  <div className={`p-4 space-y-3.5 text-xs leading-relaxed text-muted-foreground ${mobileInstructionsOpen ? 'block' : 'hidden lg:block'}`}>
                    <p>
                      Platform intelligent processing reads column headers case-insensitively and maps your data automatically.
                    </p>
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-semibold uppercase text-teal-600 dark:text-teal-400 tracking-wider">Required Columns</h4>
                      <ul className="list-disc pl-4 space-y-1 text-xs">
                        <li><strong className="text-foreground">Student ID</strong> OR <strong className="text-foreground">Student Email</strong> (for identification)</li>
                        <li><strong className="text-foreground">Date</strong> (Format: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">YYYY-MM-DD</code>)</li>
                        <li><strong className="text-foreground">Status</strong> (Accepts: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">PRESENT</code>, <code className="bg-muted px-1 py-0.5 rounded text-[11px]">ABSENT</code>)</li>
                      </ul>

                      <h4 className="text-[11px] font-semibold uppercase text-teal-600 dark:text-teal-400 tracking-wider pt-1.5">Optional Columns</h4>
                      <ul className="list-disc pl-4 space-y-1 text-xs">
                        <li><strong>Roll Number</strong> &amp; <strong>Class Name</strong> (Fallback identifier)</li>
                        <li><strong>Remarks</strong> (Short text note)</li>
                      </ul>
                    </div>

                    <div className="pt-2">
                      <Button 
                        onClick={handleDownloadTemplate} 
                        disabled={downloadingTemplate}
                        variant="outline" 
                        className="w-full h-8.5 rounded-xl border-teal-500/30 dark:border-teal-500/20 hover:bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold cursor-pointer shadow-2xs gap-2"
                      >
                        {downloadingTemplate ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" /> Generating...
                          </>
                        ) : (
                          <>
                            <Download className="size-3.5" /> Prefilled Template (.xlsx)
                          </>
                        )}
                      </Button>
                      <p className="text-[11px] text-center text-muted-foreground mt-1.5">
                        Prefilled with active students in <span className="font-semibold text-foreground">{selectedSchool.name}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <Card className={`rounded-xl border border-teal-200/50 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/20 shadow-2xs ${mobileInstructionsOpen ? 'block' : 'hidden lg:block'}`}>
                  <CardHeader className="p-3.5 pb-1">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-teal-800 dark:text-teal-300">
                      <Info className="size-3.5" /> Pro tip
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0 text-xs text-muted-foreground leading-relaxed">
                    Leave the <code className="bg-teal-100/60 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 px-1 py-0.5 rounded font-mono text-[11px]">Student ID</code> column intact! It allows the database to instantly resolve your student without worrying about spelling or collisions.
                  </CardContent>
                </Card>
              </div>

              {/* Upload & Preview Zone */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs bg-card">
                  <CardContent className="p-5">
                    
                    {/* Drag-and-drop zone */}
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-dashed border-2 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                        isDragging 
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 scale-[0.99]" 
                          : "border-slate-200 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/40 bg-slate-50/40 dark:bg-slate-900/20 hover:bg-teal-50/20 dark:hover:bg-teal-950/10"
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                      />
                      
                      <div className="size-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-100/80 dark:border-teal-900/40 flex items-center justify-center mb-3 shadow-2xs text-teal-600 dark:text-teal-400">
                        <UploadCloud className="size-6" />
                      </div>
                      
                      {uploadedFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">{uploadedFile.name}</p>
                          <p className="text-[11px] text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB • Click to swap file</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground">Drag and drop your spreadsheet here</p>
                          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                            Supports Excel (.xlsx, .xls) and CSV files. Make sure columns match the prefilled template.
                          </p>
                        </div>
                      )}
                    </div>

                    {validatingFile && (
                      <div className="flex items-center justify-center p-6 gap-2 text-xs text-muted-foreground">
                        <RefreshCw className="size-4 animate-spin text-teal-500" /> Analyzing and validating spreadsheet rows...
                      </div>
                    )}

                    {/* Parser Preview Table */}
                    {!validatingFile && parsedRows.length > 0 && (
                      <div className="space-y-3.5 mt-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">Spreadsheet Preview</h3>
                            <p className="text-xs text-muted-foreground">
                              Showing parsed rows from <span className="font-medium text-teal-600 dark:text-teal-400">{uploadedFile?.name}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs text-muted-foreground">
                              Valid: <span className="font-bold text-emerald-600 dark:text-emerald-400">{parsedRows.filter(r => r.isValid).length}</span> / {parsedRows.length}
                            </span>
                            <Button 
                              size="sm"
                              variant="outline" 
                              onClick={() => {
                                setUploadedFile(null);
                                setParsedRows([]);
                              }}
                              className="text-rose-600 hover:bg-rose-500/10 cursor-pointer gap-1 h-7.5 px-2.5 rounded-lg text-xs"
                            >
                              <Trash2 className="size-3" /> Clear
                            </Button>
                          </div>
                        </div>

                        {/* Interactive Table Container */}
                        <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden bg-card shadow-2xs">
                          <ScrollArea className="max-h-96 w-full">
                            <table className="w-full text-xs border-collapse text-left">
                              <thead className="bg-slate-50/70 dark:bg-slate-800/40 sticky top-0 border-b border-slate-200/80 dark:border-slate-800/80">
                                <tr>
                                  <th className="py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground w-10">#</th>
                                  <th className="py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Student Name</th>
                                  <th className="py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Roll / Class</th>
                                  <th className="py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Date</th>
                                  <th className="py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Status</th>
                                  <th className="py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Remarks</th>
                                  <th className="py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground text-right">Validation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parsedRows.map((row, index) => {
                                  const colorIndex = (row.studentName?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
                                  const avatarColor = AVATAR_COLORS[colorIndex];
                                  return (
                                    <tr 
                                      key={row.id} 
                                      className={`border-b border-slate-100 dark:border-slate-800/60 last:border-none hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                                        !row.isValid ? "bg-rose-500/5 dark:bg-rose-950/10" : ""
                                      }`}
                                    >
                                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                        {index + 1}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="flex items-center gap-2.5">
                                          <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${avatarColor}`}>
                                            {row.studentName?.charAt(0).toUpperCase() || "?"}
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                            <span className="font-medium text-foreground text-xs truncate">{row.studentName || <span className="text-muted-foreground italic text-xs">Unspecified</span>}</span>
                                            <span className="text-[11px] text-muted-foreground font-mono truncate">{row.studentEmail || "No Email"}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        {row.rollNumber && row.className ? (
                                          <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-foreground px-1.5 py-0.5 rounded font-mono">
                                            {row.rollNumber} | {row.className}
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-muted-foreground italic">No class details</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-xs text-foreground">{row.date}</td>
                                      <td className="py-2.5 px-3">{getStatusBadge(row.status)}</td>
                                      <td className="py-2.5 px-3 truncate max-w-[120px] text-xs text-muted-foreground">{row.remarks || "-"}</td>
                                      <td className="py-2.5 px-3 text-right">
                                        {row.isValid ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
                                            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                            Ready
                                          </span>
                                        ) : (
                                          <div className="flex flex-col items-end gap-0.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
                                              <AlertTriangle className="size-3" /> Error
                                            </span>
                                            <div className="text-[10px] text-rose-600 dark:text-rose-400 max-w-[150px] leading-tight text-right mt-0.5">
                                              {row.errors.join(", ")}
                                            </div>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </ScrollArea>
                        </div>

                        {/* Confirmation Box */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border border-teal-500/20 bg-teal-50/30 dark:bg-teal-950/20 rounded-xl">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-semibold text-foreground">Ready to upload records?</h4>
                            <p className="text-[11px] text-muted-foreground">
                              Only <span className="font-semibold text-emerald-600 dark:text-emerald-400">{parsedRows.filter(r => r.isValid).length} valid rows</span> will be imported. Invalid rows will be ignored.
                            </p>
                          </div>
                          
                          <Button
                            onClick={handleConfirmImport}
                            disabled={importingData || parsedRows.filter(r => r.isValid).length === 0}
                            className="h-8.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer shadow-xs gap-1.5 shrink-0"
                          >
                            {importingData ? (
                              <>
                                <RefreshCw className="size-3.5 animate-spin" /> Importing...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-3.5" /> Confirm &amp; Import Attendance
                              </>
                            )}
                          </Button>
                        </div>

                        {showProgress && importingData && (
                          <div className="mt-3 space-y-1.5 p-3.5 border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 rounded-xl">
                            <div className="flex justify-between text-xs font-semibold text-teal-600 dark:text-teal-400">
                              <span className="flex items-center gap-1.5"><RefreshCw className="size-3.5 animate-spin" /> Processing records...</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5 bg-teal-500/10" indicatorClassName="bg-gradient-to-r from-teal-500 to-emerald-500" />
                          </div>
                        )}

                      </div>
                    )}

                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* Sub-Tab 2: Student Date Range Bulk Entry */}
          <TabsContent value="range" className="space-y-5 animate-in fade-in-30 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:h-[720px]">
              
              {/* Form Entry Column */}
              <div className="lg:col-span-1 flex flex-col min-h-0">
                <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs bg-card flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                  <CardHeader className="p-4 pb-3 border-b border-border/40 shrink-0">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CalendarDays className="size-4 text-teal-600 dark:text-teal-400" /> Range Configurations
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">Setup range details for fast calendar insertion.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3.5 pb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    
                    {/* Toggle Selector */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Target Scope</Label>
                      <div className="grid grid-cols-2 gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/50">
                        <button
                          type="button"
                          onClick={() => setAllStudentsMode(true)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            allStudentsMode 
                              ? "bg-background shadow-xs text-foreground font-semibold" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          All School Students
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAllStudentsMode(false);
                            setStudentPopoverOpen(true);
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            !allStudentsMode 
                              ? "bg-background shadow-xs text-foreground font-semibold" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Specific Student
                        </button>
                      </div>
                    </div>

                    {/* Specific Student Selector */}
                    {!allStudentsMode && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3.5"
                      >
                        {/* Class Filter Dropdown */}
                        <div className="space-y-1.5">
                          <Label htmlFor="class-filter" className="text-xs font-medium text-muted-foreground">Filter by Class</Label>
                          <select 
                            id="class-filter"
                            value={selectedClassId} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedClassId(val);
                              if (selectedStudent && selectedStudent.classId !== val && val !== "all") {
                                setSelectedStudent(null);
                              }
                            }}
                            className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3 py-1 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-foreground"
                          >
                            <option value="all">All Classes ({uniqueClasses.length})</option>
                            {uniqueClasses.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Student Search and Select */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">Select Student</Label>
                          <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                role="combobox"
                                aria-expanded={studentPopoverOpen}
                                className="w-full justify-between cursor-pointer h-8.5 rounded-xl bg-background border-slate-200 dark:border-slate-800 text-left text-xs shadow-2xs"
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <User className="size-3.5 text-muted-foreground shrink-0" />
                                  {selectedStudent ? selectedStudent.name : "Select Student..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full max-w-[320px] p-0 border border-slate-200 dark:border-slate-800 bg-card shadow-xl rounded-xl" align="start" side="bottom" sideOffset={4}>
                              <div className="flex items-center border-b px-3 border-border">
                                <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                <Input 
                                  placeholder="Search by name, roll, class..." 
                                  value={studentSearchQuery}
                                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                                  className="flex h-8.5 w-full bg-transparent py-2 text-xs outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                                />
                              </div>
                              <ScrollArea className="h-48 p-1">
                                {loadingStudents ? (
                                  <div className="flex items-center justify-center p-4 text-xs text-muted-foreground gap-2">
                                    <RefreshCw className="size-3.5 animate-spin text-teal-500" /> Fetching student registry...
                                  </div>
                                ) : filteredStudents.length === 0 ? (
                                  <div className="p-4 text-xs text-muted-foreground text-center">No students found.</div>
                                ) : (
                                  filteredStudents.map((stu) => {
                                    const avatarColor = AVATAR_COLORS[(stu.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
                                    return (
                                      <button
                                        key={stu.id}
                                        onClick={() => {
                                          setSelectedStudent(stu);
                                          setStudentPopoverOpen(false);
                                          setStudentSearchQuery("");
                                        }}
                                        className="flex items-center justify-between w-full text-left px-2.5 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer group"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                          <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${avatarColor}`}>
                                            {stu.name?.charAt(0).toUpperCase() || "?"}
                                          </div>
                                          <div className="flex flex-col truncate">
                                            <span className="font-medium text-foreground truncate">{stu.name}</span>
                                            <span className="text-[11px] text-muted-foreground truncate font-mono">
                                              Roll: {stu.rollNumber || 'N/A'} • Class: {stu.className || 'N/A'}
                                            </span>
                                          </div>
                                        </div>
                                        {selectedStudent?.id === stu.id && (
                                          <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })
                                )}
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </motion.div>
                    )}

                    {/* Date Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="start-date" className="text-xs font-medium text-muted-foreground block">Start Date</Label>
                        <DatePicker
                          date={parseDateString(startDate)}
                          onChange={(d) => setStartDate(formatDateToString(d))}
                          placeholder="Select start date"
                          className={cn(
                            "w-full bg-background border-slate-200 dark:border-slate-800 h-8.5 rounded-xl text-xs shadow-2xs transition-colors",
                            isRangeTooLarge && "border-rose-500/80 text-rose-600 dark:text-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-500/5"
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="end-date" className="text-xs font-medium text-muted-foreground block">End Date</Label>
                        <DatePicker
                          date={parseDateString(endDate)}
                          onChange={(d) => setEndDate(formatDateToString(d))}
                          placeholder="Select end date"
                          className={cn(
                            "w-full bg-background border-slate-200 dark:border-slate-800 h-8.5 rounded-xl text-xs shadow-2xs transition-colors",
                            isRangeTooLarge && "border-rose-500/80 text-rose-600 dark:text-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-500/5"
                          )}
                        />
                      </div>
                    </div>

                    {isRangeTooLarge && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs flex items-start gap-2 leading-relaxed shadow-2xs shrink-0"
                      >
                        <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-rose-500" />
                        <div>
                          <span className="font-semibold block text-rose-800 dark:text-rose-200 text-xs">Date Range Exceeded</span>
                          <span className="mt-0.5 block text-[11px] text-rose-600 dark:text-rose-400">
                            Selected range is <strong className="font-semibold">{Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days</strong>. Maximum allowed limit is 180 days (6 months).
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Weekday Selector Checkbox Grid */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5" /> Days of the Week
                      </Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {DAYS_OF_WEEK.map((day) => {
                          const isChecked = selectedDays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => handleToggleDay(day.value)}
                              className={`flex flex-col items-center py-1.5 px-1 rounded-xl border text-xs font-medium cursor-pointer transition-all duration-150 ${
                                isChecked 
                                  ? "border-teal-500/40 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-semibold shadow-2xs" 
                                  : "border-slate-200 dark:border-slate-800 bg-background text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                              }`}
                            >
                              <span>{day.label}</span>
                              <span className="mt-0.5">
                                {isChecked ? <CheckSquare className="size-3 text-teal-600 dark:text-teal-400" /> : <Square className="size-3 text-muted-foreground/30" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Excludes weekdays you leave unchecked.</p>
                    </div>

                    {/* Status & Remarks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="range-status" className="text-xs font-medium text-muted-foreground">Range Status</Label>
                        <select 
                          id="range-status"
                          value={rangeStatus}
                          onChange={e => setRangeStatus(e.target.value)}
                          className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3 py-1 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-foreground"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="range-remarks" className="text-xs font-medium text-muted-foreground">Remarks</Label>
                        <Input 
                          id="range-remarks" 
                          placeholder="e.g. Public Holiday" 
                          value={rangeRemarks}
                          onChange={e => setRangeRemarks(e.target.value)}
                          className="w-full bg-background border-slate-200 dark:border-slate-800 h-8.5 rounded-xl text-xs shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Submission confirmation */}
                    <div className="pt-2">
                      <Button
                        onClick={handleRangeImport}
                        disabled={generatingRange || activeRangeDatesCount === 0 || isRangeTooLarge || (!allStudentsMode && !selectedStudent)}
                        className="w-full h-8.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
                      >
                        {generatingRange ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" /> Batch Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-3.5" /> Apply Attendance Range
                          </>
                        )}
                      </Button>

                      {showProgress && generatingRange && (
                        <div className="mt-2.5 space-y-1.5 p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 rounded-xl">
                          <div className="flex justify-between text-xs font-semibold text-teal-600 dark:text-teal-400">
                            <span className="flex items-center gap-1.5"><RefreshCw className="size-3 animate-spin" /> Batch Processing...</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5 bg-teal-500/10" indicatorClassName="bg-gradient-to-r from-teal-500 to-emerald-500" />
                        </div>
                      )}

                      <p className="text-[11px] text-center text-muted-foreground mt-1.5">
                        Writes <span className="font-semibold text-foreground">{activeRangeDatesCount * (allStudentsMode ? students.length : 1)} total records</span>
                      </p>
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* Preview Timeline Grid Column */}
              <div className="lg:col-span-2 flex flex-col min-h-0">
                <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs bg-card flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                  <CardHeader className="p-4 pb-3 border-b border-border/40 shrink-0">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="size-4 text-teal-600 dark:text-teal-400" /> Active Calendar Preview
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">Visual breakdown of dates targeted for batch insertion.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col min-h-0 p-4 pb-5 relative">
                    {isRangeTooLarge ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-rose-600 dark:text-rose-400 py-12 border border-dashed border-rose-300 dark:border-rose-900/40 rounded-xl min-h-[250px] bg-rose-50/30 dark:bg-rose-950/10 px-4 space-y-2">
                        <div className="size-10 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 shrink-0">
                          <AlertTriangle className="size-5 text-rose-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-rose-800 dark:text-rose-200">Date Range Exceeded</p>
                          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                            Selected range exceeds the allowed limit. Please select <strong>180 days or less</strong>.
                          </p>
                        </div>
                      </div>
                    ) : computedRangeDates.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-16 border border-dashed border-border rounded-xl min-h-[250px]">
                        <CalendarDays className="size-8 text-muted-foreground/40 animate-pulse mb-2.5" />
                        <p className="text-xs font-semibold text-foreground">Select Date Range</p>
                        <p className="text-[11px] text-muted-foreground">Setup Start and End dates to generate calendar previews here.</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-xs shrink-0">
                          <div>
                            Targeting: <span className="font-semibold text-foreground">{allStudentsMode ? `All ${students.length} students` : selectedStudent?.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span>
                              Active Days: <span className="font-bold text-teal-600 dark:text-teal-400">{activeRangeDatesCount}</span> / {computedRangeDates.length}
                            </span>
                            <span className="flex items-center gap-1.5">
                              Status: {getStatusBadge(rangeStatus)}
                            </span>
                          </div>
                        </div>

                        {/* Date Grid Scrollable Wrapper */}
                        <div 
                          ref={scrollRef}
                          onScroll={handleScroll}
                          className="overflow-y-auto pl-1 flex-1 min-h-0 [direction:rtl] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
                        >
                          {/* Inner Grid Container */}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 [direction:ltr] w-full">
                            <AnimatePresence>
                               {computedRangeDates.map((item, idx) => (
                                 <motion.div
                                  key={item.dateStr}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.2) }}
                                  onClick={() => {
                                    if (!item.isValid) return;
                                    const currentStatus = overriddenStatuses[item.dateStr] || rangeStatus;
                                    const newStatus = currentStatus === "present" ? "absent" : "present";
                                    setOverriddenStatuses(prev => ({
                                      ...prev,
                                      [item.dateStr]: newStatus
                                    }));
                                  }}
                                  className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 justify-between transition-colors relative overflow-hidden select-none ${
                                    item.isValid 
                                      ? (overriddenStatuses[item.dateStr] || rangeStatus) === "present"
                                        ? "border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 hover:bg-emerald-50/80 cursor-pointer shadow-2xs"
                                        : "border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-50/80 cursor-pointer shadow-2xs"
                                      : "border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 text-muted-foreground line-through opacity-40"
                                  }`}
                                >
                                  {item.isValid && (
                                    <div className={`absolute top-0 right-0 size-2.5 rounded-bl-md ${
                                      (overriddenStatuses[item.dateStr] || rangeStatus) === "present"
                                        ? "bg-emerald-500"
                                        : "bg-rose-500"
                                    }`} />
                                  )}
                                  <div className="text-[11px] font-medium text-muted-foreground">{item.dayLabel}</div>
                                  <div className="text-xs font-bold font-mono text-foreground">{item.dateStr}</div>
                                  <div className="mt-1 flex justify-between w-full items-center gap-1">
                                    {item.isValid ? (
                                      <>
                                        <select
                                          value={overriddenStatuses[item.dateStr] || rangeStatus}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            const val = e.target.value;
                                            setOverriddenStatuses(prev => ({
                                              ...prev,
                                              [item.dateStr]: val
                                            }));
                                          }}
                                          className={`text-[11px] font-medium py-0.5 px-1.5 bg-background border rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-0 ${
                                            (overriddenStatuses[item.dateStr] || rangeStatus) === "present"
                                              ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50"
                                              : "border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-50/50"
                                          }`}
                                        >
                                          <option value="present" className="text-foreground bg-background">Present</option>
                                          <option value="absent" className="text-foreground bg-background">Absent</option>
                                        </select>
                                        <span className="text-[10px] text-muted-foreground max-w-[65px] truncate" title={overriddenRemarks[item.dateStr] || rangeRemarks}>
                                          {overriddenRemarks[item.dateStr] || rangeRemarks || "No remarks"}
                                        </span>
                                      </>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] text-muted-foreground opacity-50 capitalize py-0 px-1.5 h-5">
                                        Skipped
                                      </Badge>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Premium Custom Scroll Progress Circular Button */}
                    {computedRangeDates.length > 0 && (
                      <button
                        onClick={() => {
                          const element = scrollRef.current;
                          if (!element) return;
                          if (isScrolledToBottom) {
                            element.scrollTo({ top: 0, behavior: 'smooth' });
                          } else {
                            element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
                          }
                        }}
                        className="absolute bottom-4 right-4 z-30 size-9 rounded-full bg-background border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center cursor-pointer transition-all shrink-0 group hover:shadow-lg"
                        title={isScrolledToBottom ? "Scroll to Top" : "Scroll to Bottom"}
                      >
                        <svg className="absolute inset-0 size-9 -rotate-90">
                          <circle
                            className="text-slate-100 dark:text-slate-800"
                            strokeWidth="2"
                            stroke="currentColor"
                            fill="transparent"
                            r="14"
                            cx="18"
                            cy="18"
                          />
                          <circle
                            className="text-teal-500 transition-all duration-100"
                            strokeWidth="2.5"
                            strokeDasharray={88}
                            strokeDashoffset={88 - (88 * scrollProgress) / 100}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="14"
                            cx="18"
                            cy="18"
                          />
                        </svg>
                        <svg 
                          className={`size-3.5 text-teal-600 dark:text-teal-400 transition-transform duration-300 group-hover:translate-y-0.5 ${
                            isScrolledToBottom ? "rotate-180 group-hover:-translate-y-0.5" : ""
                          }`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
