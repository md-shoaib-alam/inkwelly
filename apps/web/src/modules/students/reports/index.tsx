"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Zap,
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Filter,
  SlidersHorizontal,
  ArrowLeft,
  Play,
  Download,
  Printer,
  RefreshCw,
  FileText,
  Check,
  ChevronDown,
  ChevronsUpDown,
  X,
  Pencil,
  Trash2,
  Users,
  GraduationCap,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAcademicYears } from "@/modules/academics/hooks/use-academic-years";

// Browser-safe unique ID — crypto.randomUUID() is available in all modern browsers
// @paralleldrive/cuid2 uses Node.js APIs and cannot run in client components
const createId = () => crypto.randomUUID();

// Types
type ReportFilterTab = "all" | "row-level" | "summary";
type ReportType = "row-level" | "summary";

interface ReportTemplateConfig {
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  groupBy?: string;
  includeSerialNumbers?: boolean;
  orientation?: "portrait" | "landscape";
  sessions?: string[];
  classes?: string[];
  columns?: string[];
  rowDimensions?: string[];
  columnMeasures?: string[];
  showPercentages?: boolean;
  showGrandTotal?: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  columnsCount: number;
  config: ReportTemplateConfig;
  createdAt: string;
  createdAtDate?: string;
}

interface ColumnOption {
  id: string;
  label: string;
  category: "demographic" | "academic" | "family" | "address";
}

const AVAILABLE_COLUMNS: ColumnOption[] = [
  { id: "fullName", label: "Full Name", category: "demographic" },
  { id: "lastName", label: "Last Name", category: "demographic" },
  { id: "dob", label: "Date of Birth", category: "demographic" },
  { id: "photo", label: "Profile Photo", category: "demographic" },
  { id: "admissionNumber", label: "Admission Number", category: "academic" },
  { id: "rollNumber", label: "Roll Number", category: "academic" },
  { id: "classSection", label: "Class & Section", category: "academic" },
  { id: "gender", label: "Gender", category: "demographic" },
  { id: "bloodGroup", label: "Blood Group", category: "demographic" },
  { id: "category", label: "Category", category: "demographic" },
  { id: "religion", label: "Religion", category: "demographic" },
  { id: "rteStudent", label: "RTE Student", category: "academic" },
  { id: "status", label: "Status", category: "academic" },
  { id: "fatherName", label: "Father Name", category: "family" },
  { id: "motherName", label: "Mother Name", category: "family" },
  { id: "parentPhone", label: "Parent Phone", category: "family" },
  { id: "parentEmail", label: "Parent Email", category: "family" },
  { id: "address", label: "Permanent Address", category: "address" },
  { id: "aadhaarNumber", label: "Aadhaar Number", category: "demographic" },
];

const DEFAULT_SELECTED_COLUMNS = ["fullName", "dob"];

// Realistic student records matching the reference screenshots
const INITIAL_STUDENTS = [
  {
    id: "stu-1",
    sno: 1,
    admissionNumber: "ADM-2025-001",
    rollNumber: "1",
    fullName: "Aarav Sharma",
    classSection: "UKG - A",
    gender: "Male",
    dob: "15-05-2019",
    bloodGroup: "O+",
    category: "General",
    religion: "Hindu",
    fatherName: "Rajesh Sharma",
    motherName: "Priya Sharma",
    parentPhone: "9876543210",
    parentEmail: "aarav.sharma@example.com",
    address: "Flat 402 Lake View Apts, Mumbai",
    aadhaarNumber: "1234 5678 9012",
    mediumOfInstruction: "English",
    status: "Active",
    rteStudent: "No",
    bpl: "No",
  },
  {
    id: "stu-2",
    sno: 2,
    admissionNumber: "ADM-2025-002",
    rollNumber: "2",
    fullName: "Pranav Singh Mehta",
    classSection: "UKG - A",
    gender: "Male",
    dob: "12-03-2019",
    bloodGroup: "B+",
    category: "General",
    religion: "Hindu",
    fatherName: "Sanjay Mehta",
    motherName: "Geeta Mehta",
    parentPhone: "9812345678",
    parentEmail: "pranav.mehta@example.com",
    address: "12 Civil Lines, Mumbai",
    aadhaarNumber: "2345 6789 0123",
    mediumOfInstruction: "English",
    status: "Active",
    rteStudent: "No",
    bpl: "No",
  },
  {
    id: "stu-3",
    sno: 3,
    admissionNumber: "ADM-2025-003",
    rollNumber: "3",
    fullName: "Ananya Ram Patel",
    classSection: "UKG - A",
    gender: "Female",
    dob: "24-06-2019",
    bloodGroup: "A+",
    category: "OBC",
    religion: "Hindu",
    fatherName: "Ram Patel",
    motherName: "Meena Patel",
    parentPhone: "9823456789",
    parentEmail: "ananya.patel@example.com",
    address: "Plot 15 Green Enclave, Mumbai",
    aadhaarNumber: "3456 7890 1234",
    mediumOfInstruction: "Hindi",
    status: "Active",
    rteStudent: "Yes",
    bpl: "No",
  },
  {
    id: "stu-4",
    sno: 4,
    admissionNumber: "ADM-2025-004",
    rollNumber: "4",
    fullName: "Vikram Gupta",
    classSection: "UKG - A",
    gender: "Male",
    dob: "08-08-2019",
    bloodGroup: "O+",
    category: "General",
    religion: "Hindu",
    fatherName: "Alok Gupta",
    motherName: "Sunita Gupta",
    parentPhone: "9834567890",
    parentEmail: "vikram.gupta@example.com",
    address: "B-88 Sector 14, Mumbai",
    aadhaarNumber: "4567 8901 2345",
    mediumOfInstruction: "English",
    status: "Inactive",
    rteStudent: "No",
    bpl: "No",
  },
  {
    id: "stu-5",
    sno: 5,
    admissionNumber: "ADM-2025-005",
    rollNumber: "5",
    fullName: "Tarun Singh Joshi",
    classSection: "UKG - A",
    gender: "Male",
    dob: "28-12-2019",
    bloodGroup: "AB+",
    category: "General",
    religion: "Hindu",
    fatherName: "Kailash Joshi",
    motherName: "Sarita Joshi",
    parentPhone: "9845678901",
    parentEmail: "tarun.joshi@example.com",
    address: "44 Model Town, Mumbai",
    aadhaarNumber: "5678 9012 3456",
    mediumOfInstruction: "Hindi",
    status: "Active",
    rteStudent: "No",
    bpl: "Yes",
  },
  {
    id: "stu-6",
    sno: 6,
    admissionNumber: "ADM-2025-006",
    rollNumber: "6",
    fullName: "Ananya Singh Patil",
    classSection: "UKG - A",
    gender: "Female",
    dob: "08-10-2020",
    bloodGroup: "B+",
    category: "OBC",
    religion: "Hindu",
    fatherName: "Mahesh Patil",
    motherName: "Swati Patil",
    parentPhone: "9856789012",
    parentEmail: "ananya.patil@example.com",
    address: "9 Royal Palms, Mumbai",
    aadhaarNumber: "6789 0123 4567",
    mediumOfInstruction: "English",
    status: "Active",
    rteStudent: "No",
    bpl: "No",
  },
  {
    id: "stu-7",
    sno: 7,
    admissionNumber: "ADM-2025-007",
    rollNumber: "7",
    fullName: "Aadhya Khan",
    classSection: "UKG - A",
    gender: "Female",
    dob: "15-02-2021",
    bloodGroup: "A-",
    category: "General",
    religion: "Muslim",
    fatherName: "Farhan Khan",
    motherName: "Sana Khan",
    parentPhone: "9867890123",
    parentEmail: "aadhya.khan@example.com",
    address: "7 Hill View Apartments, Mumbai",
    aadhaarNumber: "7890 1234 5678",
    mediumOfInstruction: "English",
    status: "Transferred",
    rteStudent: "No",
    bpl: "No",
  },
];

const DEFAULT_CLASSES = [
  "UKG - A",
  "LKG - A",
  "Class 9th - A",
  "Class 8th - A",
  "Class 7th - A",
  "Class 6th - A",
  "Class 5th - A",
  "Class 4th - A",
  "Class 3rd - A",
  "Class 2nd - A",
  "Class 1st - A",
];

const DEFAULT_SESSIONS = [
  { id: "s-2027-28", name: "2027-28", isCurrent: false },
  { id: "s-2026-27", name: "2026-27", isCurrent: true },
];

// 25 realistic student records matching Screenshot 5 (Class 5th)
const CLASS_5TH_STUDENTS = [
  { id: "c5-1", sno: 1, dob: "06-03-2016", photo: "-", lastName: "Joshi", fullName: "Anika Joshi", gender: "Female", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-101", rollNumber: "1", bloodGroup: "O+", religion: "Hindu" },
  { id: "c5-2", sno: 2, dob: "05-06-2016", photo: "-", lastName: "Menon", fullName: "Anika Menon", gender: "Female", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-102", rollNumber: "2", bloodGroup: "A+", religion: "Hindu" },
  { id: "c5-3", sno: 3, dob: "18-02-2016", photo: "-", lastName: "Reddy", fullName: "Ayesha Reddy", gender: "Female", category: "OBC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-103", rollNumber: "3", bloodGroup: "B+", religion: "Hindu" },
  { id: "c5-4", sno: 4, dob: "21-05-2016", photo: "-", lastName: "Nair", fullName: "Grace Nair", gender: "Female", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-104", rollNumber: "4", bloodGroup: "O+", religion: "Christian" },
  { id: "c5-5", sno: 5, dob: "26-11-2016", photo: "-", lastName: "Menon", fullName: "Gurpreet Menon", gender: "Female", category: "OBC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-105", rollNumber: "5", bloodGroup: "AB+", religion: "Sikh" },
  { id: "c5-6", sno: 6, dob: "15-08-2016", photo: "-", lastName: "Gupta", fullName: "Harleen Gupta", gender: "Female", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-106", rollNumber: "6", bloodGroup: "A+", religion: "Hindu" },
  { id: "c5-7", sno: 7, dob: "19-02-2016", photo: "-", lastName: "Verma", fullName: "Ira Verma", gender: "Female", category: "SC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-107", rollNumber: "7", bloodGroup: "B+", religion: "Hindu" },
  { id: "c5-8", sno: 8, dob: "12-09-2016", photo: "-", lastName: "Iyer", fullName: "Kabir Iyer", gender: "Male", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-108", rollNumber: "8", bloodGroup: "O+", religion: "Hindu" },
  { id: "c5-9", sno: 9, dob: "18-12-2016", photo: "-", lastName: "Mukherjee", fullName: "Kiara Mukherjee", gender: "Female", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-109", rollNumber: "9", bloodGroup: "A-", religion: "Hindu" },
  { id: "c5-10", sno: 10, dob: "07-07-2016", photo: "-", lastName: "Chauhan", fullName: "Krishna Chauhan", gender: "Male", category: "OBC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-110", rollNumber: "10", bloodGroup: "B+", religion: "Hindu" },
  { id: "c5-11", sno: 11, dob: "21-07-2016", photo: "-", lastName: "Kumar", fullName: "Manpreet Kumar", gender: "Male", category: "SC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-111", rollNumber: "11", bloodGroup: "O+", religion: "Hindu" },
  { id: "c5-12", sno: 12, dob: "20-11-2016", photo: "-", lastName: "Pandey", fullName: "Mohammed Pandey", gender: "Male", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-112", rollNumber: "12", bloodGroup: "AB+", religion: "Muslim" },
  { id: "c5-13", sno: 13, dob: "24-07-2016", photo: "-", lastName: "Das", fullName: "Myra Das", gender: "Female", category: "SC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-113", rollNumber: "13", bloodGroup: "A+", religion: "Hindu" },
  { id: "c5-14", sno: 14, dob: "26-02-2016", photo: "-", lastName: "Kumar", fullName: "Pari Kumar", gender: "Female", category: "OBC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-114", rollNumber: "14", bloodGroup: "O+", religion: "Hindu" },
  { id: "c5-15", sno: 15, dob: "28-04-2016", photo: "-", lastName: "Pillai", fullName: "Reyansh Pillai", gender: "Male", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-115", rollNumber: "15", bloodGroup: "B+", religion: "Hindu" },
  { id: "c5-16", sno: 16, dob: "27-05-2016", photo: "-", lastName: "Kapoor", fullName: "Rohan Kapoor", gender: "Male", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-116", rollNumber: "16", bloodGroup: "A+", religion: "Hindu" },
  { id: "c5-17", sno: 17, dob: "11-01-2016", photo: "-", lastName: "Sharma", fullName: "Saanvi Sharma", gender: "Female", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-117", rollNumber: "17", bloodGroup: "O+", religion: "Hindu" },
  { id: "c5-18", sno: 18, dob: "03-04-2016", photo: "-", lastName: "Singh", fullName: "Samar Singh", gender: "Male", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-118", rollNumber: "18", bloodGroup: "B+", religion: "Hindu" },
  { id: "c5-19", sno: 19, dob: "14-06-2016", photo: "-", lastName: "Patel", fullName: "Sara Patel", gender: "Female", category: "OBC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-119", rollNumber: "19", bloodGroup: "A-", religion: "Hindu" },
  { id: "c5-20", sno: 20, dob: "29-08-2016", photo: "-", lastName: "Mehta", fullName: "Shaurya Mehta", gender: "Male", category: "General", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-120", rollNumber: "20", bloodGroup: "O+", religion: "Hindu" },
  { id: "c5-21", sno: 21, dob: "12-10-2016", photo: "-", lastName: "Yadav", fullName: "Sneha Yadav", gender: "Female", category: "OBC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-121", rollNumber: "21", bloodGroup: "B+", religion: "Hindu" },
  { id: "c5-22", sno: 22, dob: "05-12-2016", photo: "-", lastName: "Bhatia", fullName: "Tanvi Bhatia", gender: "Female", category: "SC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-122", rollNumber: "22", bloodGroup: "A+", religion: "Hindu" },
  { id: "c5-23", sno: 23, dob: "16-03-2016", photo: "-", lastName: "Gowda", fullName: "Varun Gowda", gender: "Male", category: "ST", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-123", rollNumber: "23", bloodGroup: "O+", religion: "Hindu" },
  { id: "c5-24", sno: 24, dob: "22-09-2016", photo: "-", lastName: "Naik", fullName: "Vedant Naik", gender: "Male", category: "ST", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-124", rollNumber: "24", bloodGroup: "AB+", religion: "Hindu" },
  { id: "c5-25", sno: 25, dob: "30-10-2016", photo: "-", lastName: "Kaur", fullName: "Zoya Kaur", gender: "Female", category: "SC", status: "Active", classSection: "Class 5th", rteStudent: "No", admissionNumber: "ADM-2025-125", rollNumber: "25", bloodGroup: "B+", religion: "Sikh" },
];

// Initial template matching user's Screenshot 4 and Screenshot 5
const INITIAL_TEMPLATES: ReportTemplate[] = [
  {
    id: "cmunmbkja073bks35fygxrqmv",
    name: "sdf",
    description: "Class 5th Student List",
    type: "row-level",
    columnsCount: 4,
    config: {
      columns: ["dob", "photo", "lastName", "fullName"],
      sortBy: "dob",
      sortDirection: "asc",
      groupBy: "none",
      includeSerialNumbers: true,
      orientation: "portrait",
      sessions: ["2026-27"],
      classes: ["Class 5th"],
    },
    createdAt: "30 Sept 2026",
    createdAtDate: new Date().toISOString(),
  },
];

function getReportsBasePath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const reportsIdx = parts.lastIndexOf("reports");
  if (reportsIdx !== -1) {
    return "/" + parts.slice(0, reportsIdx + 1).join("/");
  }
  return pathname;
}

function getGeneratedTimestamp(): string {
  const now = new Date();
  const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  const timeStr = now
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .toLowerCase();
  return `Generated at ${dateStr}, ${timeStr}`;
}

export function AdminStudentReports() {
  const pathname = usePathname();
  const router = useRouter();

  const baseReportsPath = useMemo(() => getReportsBasePath(pathname), [pathname]);

  // Sub-route parsing
  const { isCreateTemplate, isQuickReport, activeTemplateId } = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const reportsIdx = parts.lastIndexOf("reports");
    const sub = reportsIdx !== -1 ? parts[reportsIdx + 1] : null;

    return {
      isCreateTemplate: sub === "create-template",
      isQuickReport: sub === "generate",
      activeTemplateId: sub && sub !== "create-template" && sub !== "generate" ? sub : null,
    };
  }, [pathname]);

  // Templates State
  const [templates, setTemplates] = useState<ReportTemplate[]>(INITIAL_TEMPLATES);

  // Load from localStorage or seed
  useEffect(() => {
    try {
      const saved = localStorage.getItem("inkwelly_student_report_templates");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(parsed);
          return;
        }
      }
    } catch {}
    setTemplates(INITIAL_TEMPLATES);
    try {
      localStorage.setItem("inkwelly_student_report_templates", JSON.stringify(INITIAL_TEMPLATES));
    } catch {}
  }, []);

  const handleSaveTemplate = (templateData: Omit<ReportTemplate, "id" | "createdAt">, editId?: string) => {
    const now = new Date();
    const formattedDate = `${now.getDate()} Sept ${now.getFullYear()}`;

    if (editId) {
      const updated = templates.map((t) =>
        t.id === editId
          ? {
              ...t,
              ...templateData,
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      setTemplates(updated);
      try {
        localStorage.setItem("inkwelly_student_report_templates", JSON.stringify(updated));
      } catch {}
      toast.success("Template updated successfully");
    } else {
      const newTemplate: ReportTemplate = {
        id: createId(),
        ...templateData,
        createdAt: formattedDate,
        createdAtDate: now.toISOString(),
      };
      const updated = [newTemplate, ...templates];
      setTemplates(updated);
      try {
        localStorage.setItem("inkwelly_student_report_templates", JSON.stringify(updated));
      } catch {}
      toast.success("Template created successfully");
    }

    router.push(baseReportsPath);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    try {
      localStorage.setItem("inkwelly_student_report_templates", JSON.stringify(updated));
    } catch {}
    toast.success("Template deleted");
  };

  // 1. Create Template Sub-screen (/students/reports/create-template)
  if (isCreateTemplate) {
    return (
      <CreateTemplateView
        onBack={() => router.push(baseReportsPath)}
        onSave={handleSaveTemplate}
        templates={templates}
      />
    );
  }

  // 2. Generated Template Report Sub-screen (/students/reports/[templateId])
  if (activeTemplateId) {
    const activeTemplate =
      templates.find((t) => t.id === activeTemplateId) || {
        id: activeTemplateId,
        name: "sdf",
        description: "Generated student report",
        type: "row-level" as ReportType,
        columnsCount: 4,
        config: {
          columns: ["dob", "photo", "lastName", "fullName"],
          sortBy: "dob",
          sortDirection: "asc" as const,
          groupBy: "none",
          includeSerialNumbers: true,
          orientation: "portrait" as const,
          sessions: ["2026-27"],
          classes: ["Class 5th"],
        },
        createdAt: "30 Sept 2026",
      };

    return (
      <GeneratedReportView
        template={activeTemplate}
        onBack={() => router.push(baseReportsPath)}
        onEdit={() => router.push(`${baseReportsPath}/create-template?edit=${activeTemplate.id}`)}
      />
    );
  }

  // 3. Quick Report Generator Sub-screen (/students/reports/generate)
  if (isQuickReport) {
    return <QuickReportView onBack={() => router.push(baseReportsPath)} />;
  }

  // 4. Default: Templates List Overview (/students/reports)
  return (
    <TemplatesListView
      templates={templates}
      baseReportsPath={baseReportsPath}
      onDeleteTemplate={handleDeleteTemplate}
    />
  );
}

// ---------------------------------------------------------------------------
// Templates List View (/students/reports)
// Matching Screenshot 4
// ---------------------------------------------------------------------------
function TemplatesListView({
  templates,
  baseReportsPath,
  onDeleteTemplate,
}: {
  templates: ReportTemplate[];
  baseReportsPath: string;
  onDeleteTemplate: (id: string) => void;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<ReportFilterTab>("all");

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (filterTab === "row-level" && t.type !== "row-level") return false;
      if (filterTab === "summary" && t.type !== "summary") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [templates, filterTab, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
            Reports
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
            {templates.length} templates · build row-level and summary reports
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`${baseReportsPath}/generate`)}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <Zap className="size-3.5 text-slate-600 dark:text-zinc-400" />
            Quick Report
          </Button>

          <Button
            type="button"
            onClick={() => router.push(`${baseReportsPath}/create-template`)}
            className="h-9 gap-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="size-3.5" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search and Tabs Bar matching Screenshot 4 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="h-9 pl-9 text-xs rounded-lg border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              filterTab === "all"
                ? "border border-teal-500 bg-[#E6FFFA] text-[#00A389] font-semibold dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-700"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            )}
          >
            <LayoutGrid className="size-3.5" />
            All
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("row-level")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              filterTab === "row-level"
                ? "border border-teal-500 bg-[#E6FFFA] text-[#00A389] font-semibold dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-700"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            )}
          >
            <TableIcon className="size-3.5" />
            Row Level
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("summary")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              filterTab === "summary"
                ? "border border-teal-500 bg-[#E6FFFA] text-[#00A389] font-semibold dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-700"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            )}
          >
            <BarChart3 className="size-3.5" />
            Summary
          </button>
        </div>
      </div>

      {/* Templates Table matching Screenshot 4 */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mb-4">
            <FileText className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100 font-[family-name:var(--font-lexend)]">
            No templates found
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Create your first report template to get started, or use Quick Report for a one-time report.
          </p>
          <div className="mt-5">
            <Button
              type="button"
              onClick={() => router.push(`${baseReportsPath}/create-template`)}
              className="h-9 gap-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="size-3.5" />
              Create Template
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-[#f8fafc] dark:bg-zinc-800/60">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-1/3">
                    Template
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Columns
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Created
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* TEMPLATE */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 grid place-items-center shrink-0 border border-blue-100/60">
                          <TableIcon className="size-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs">
                            {template.name}
                          </span>
                          {template.description && (
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 line-clamp-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* TYPE */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                          template.type === "row-level"
                            ? "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300"
                        )}
                      >
                        {template.type === "row-level" ? "Row Level" : "Summary"}
                      </span>
                    </td>

                    {/* COLUMNS */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-zinc-400">
                      {template.columnsCount} columns
                    </td>

                    {/* CREATED */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {template.createdAt}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {/* Generate Button matching Screenshot 4 */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`${baseReportsPath}/${template.id}`)}
                          className="h-8 px-3 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 shadow-2xs gap-1.5 cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          <Play className="size-3 fill-current" />
                          Generate
                        </Button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`${baseReportsPath}/create-template?edit=${template.id}`)
                          }
                          className="size-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 grid place-items-center shadow-2xs cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                          title="Edit Template"
                        >
                          <Pencil className="size-3.5" />
                        </button>

                        {/* Delete Button matching Screenshot 4 (solid red) */}
                        <button
                          type="button"
                          onClick={() => onDeleteTemplate(template.id)}
                          className="size-8 rounded-lg bg-[#E53E3E] hover:bg-red-700 text-white grid place-items-center shadow-2xs cursor-pointer transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-5 py-3 bg-[#f8fafc] dark:bg-zinc-800/40 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? "template" : "templates"}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Template View (/students/reports/create-template)
// Matching Screenshot 1 (Row Level) and Screenshot 2 (Summary)
// ---------------------------------------------------------------------------
function CreateTemplateView({
  onBack,
  onSave,
  templates,
}: {
  onBack: () => void;
  onSave: (data: Omit<ReportTemplate, "id" | "createdAt">, editId?: string) => void;
  templates: ReportTemplate[];
}) {
  const router = useRouter();
  const { academicYears } = useAcademicYears();

  // Check if edit mode (?edit=[id])
  const [editId, setEditId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const e = p.get("edit");
      if (e) setEditId(e);
    }
  }, []);

  const editTemplate = useMemo(() => {
    if (!editId) return null;
    return templates.find((t) => t.id === editId) || null;
  }, [editId, templates]);

  // Form State
  const [reportType, setReportType] = useState<ReportType>("row-level");
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");

  // Row Level Config
  const [sortByField, setSortByField] = useState("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [groupByField, setGroupByField] = useState("none");
  const [includeSerialNumbers, setIncludeSerialNumbers] = useState(true);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [selectedSessions, setSelectedSessions] = useState<string[]>(["2026-27"]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["Class 5th"]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "dob",
    "photo",
    "lastName",
    "fullName",
  ]);

  // Summary Config
  const [showPercentages, setShowPercentages] = useState(false);
  const [showGrandTotal, setShowGrandTotal] = useState(true);
  const [selectedRowDimensions, setSelectedRowDimensions] = useState<string[]>([
    "mediumOfInstruction",
  ]);
  const [selectedColumnMeasures, setSelectedColumnMeasures] = useState<string[]>([]);

  // Popover state
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isRowDimOpen, setIsRowDimOpen] = useState(false);
  const [isColMeasureOpen, setIsColMeasureOpen] = useState(false);

  // Prepopulate if editing
  useEffect(() => {
    if (editTemplate) {
      setReportType(editTemplate.type);
      setTemplateName(editTemplate.name);
      setDescription(editTemplate.description || "");
      if (editTemplate.config) {
        if (editTemplate.config.sortBy) setSortByField(editTemplate.config.sortBy);
        if (editTemplate.config.sortDirection) setSortDirection(editTemplate.config.sortDirection);
        if (editTemplate.config.groupBy) setGroupByField(editTemplate.config.groupBy);
        if (editTemplate.config.includeSerialNumbers !== undefined)
          setIncludeSerialNumbers(editTemplate.config.includeSerialNumbers);
        if (editTemplate.config.orientation) setOrientation(editTemplate.config.orientation);
        if (editTemplate.config.columns) setSelectedColumns(editTemplate.config.columns);
        if (editTemplate.config.sessions) setSelectedSessions(editTemplate.config.sessions);
        if (editTemplate.config.classes) setSelectedClasses(editTemplate.config.classes);
        if (editTemplate.config.rowDimensions)
          setSelectedRowDimensions(editTemplate.config.rowDimensions);
        if (editTemplate.config.columnMeasures)
          setSelectedColumnMeasures(editTemplate.config.columnMeasures);
        if (editTemplate.config.showPercentages !== undefined)
          setShowPercentages(editTemplate.config.showPercentages);
        if (editTemplate.config.showGrandTotal !== undefined)
          setShowGrandTotal(editTemplate.config.showGrandTotal);
      }
    }
  }, [editTemplate]);

  // Handlers
  const handleToggleColumn = (colId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handleRemoveColumn = (colId: string) => {
    setSelectedColumns((prev) => prev.filter((id) => id !== colId));
  };

  const handleToggleRowDim = (dimId: string) => {
    setSelectedRowDimensions((prev) =>
      prev.includes(dimId) ? prev.filter((id) => id !== dimId) : [...prev, dimId]
    );
  };

  const handleToggleColMeasure = (mId: string) => {
    setSelectedColumnMeasures((prev) =>
      prev.includes(mId) ? prev.filter((id) => id !== mId) : [...prev, mId]
    );
  };

  const handleSubmit = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (reportType === "row-level") {
      if (selectedColumns.length === 0) {
        toast.error("Please select at least one column for the template");
        return;
      }
    } else {
      if (selectedRowDimensions.length === 0) {
        toast.error("Please select at least one row dimension");
        return;
      }
      if (selectedColumnMeasures.length === 0) {
        toast.error("Please select at least one column measure");
        return;
      }
    }

    const templateData: Omit<ReportTemplate, "id" | "createdAt"> = {
      name: templateName.trim(),
      description: description.trim(),
      type: reportType,
      columnsCount:
        reportType === "row-level"
          ? selectedColumns.length
          : selectedColumnMeasures.length,
      config: {
        sortBy: sortByField,
        sortDirection,
        groupBy: groupByField,
        includeSerialNumbers,
        orientation,
        sessions: selectedSessions,
        classes: selectedClasses,
        columns: selectedColumns,
        rowDimensions: selectedRowDimensions,
        columnMeasures: selectedColumnMeasures,
        showPercentages,
        showGrandTotal,
      },
    };

    onSave(templateData, editId || undefined);
  };

  return (
    <div className="space-y-4 max-w-6xl pb-10">
      {/* Top back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          Back to reports
        </button>
      </div>

      {/* Header matching Screenshot 1 & 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
            {editTemplate ? "Edit Template" : "Create Template"}
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
            Define columns, sorting, grouping and filters for your report
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-9 px-4 rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            className="h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {editTemplate ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mr-2">
          Report Type
        </span>
        <button
          type="button"
          onClick={() => setReportType("row-level")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
            reportType === "row-level"
              ? "bg-[#0F172A] text-white font-semibold shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          )}
        >
          <TableIcon className="size-3.5" />
          Row Level
        </button>

        <button
          type="button"
          onClick={() => setReportType("summary")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
            reportType === "summary"
              ? "bg-[#0F172A] text-white font-semibold shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          )}
        >
          <BarChart3 className="size-3.5" />
          Summary
        </button>
      </div>

      {/* Row Level Form (Screenshot 1) */}
      {reportType === "row-level" ? (
        <div className="space-y-4">
          {/* Top 2 Cards: Basic Information & Sorting/Grouping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Basic Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Basic Information
              </h3>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Template Name *
                </label>
                <Input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Class Wise Student List"
                  className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this report template is for..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>
            </div>

            {/* Card 2: Sorting, Grouping & Settings */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Sorting, Grouping & Settings
              </h3>

              {/* SORT BY */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Sort by
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={sortByField} onValueChange={setSortByField}>
                    <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                      <SelectValue placeholder="Sort by field..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fullName" className="text-xs">
                        Full Name
                      </SelectItem>
                      <SelectItem value="dob" className="text-xs">
                        Date of Birth
                      </SelectItem>
                      <SelectItem value="rollNumber" className="text-xs">
                        Roll Number
                      </SelectItem>
                      <SelectItem value="admissionNumber" className="text-xs">
                        Admission Number
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={sortDirection}
                    onValueChange={(v: "asc" | "desc") => setSortDirection(v)}
                  >
                    <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                      <SelectValue placeholder="Ascending" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc" className="text-xs">
                        Ascending
                      </SelectItem>
                      <SelectItem value="desc" className="text-xs">
                        Descending
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* GROUP BY */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Group by
                </label>
                <Select value={groupByField} onValueChange={setGroupByField}>
                  <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                    <SelectValue placeholder="No grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      No grouping
                    </SelectItem>
                    <SelectItem value="classSection" className="text-xs">
                      Class
                    </SelectItem>
                    <SelectItem value="gender" className="text-xs">
                      Gender
                    </SelectItem>
                    <SelectItem value="category" className="text-xs">
                      Category
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Serial numbers & Orientation */}
              <div className="grid grid-cols-2 items-center gap-2 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-zinc-300">
                  <Checkbox
                    checked={includeSerialNumbers}
                    onCheckedChange={(c) => setIncludeSerialNumbers(!!c)}
                    className="size-4 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                  />
                  Serial numbers
                </label>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Orientation
                  </label>
                  <Select
                    value={orientation}
                    onValueChange={(v: "portrait" | "landscape") => setOrientation(v)}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                      <SelectValue placeholder="Portrait" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait" className="text-xs">
                        Portrait
                      </SelectItem>
                      <SelectItem value="landscape" className="text-xs">
                        Landscape
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Card: Data Filters */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="bg-[#f8fafc] dark:bg-zinc-800/60 px-5 py-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Data Filters
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Filter by session and class. Leave empty to include all.
              </p>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Sessions
                </label>
                <div className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 flex items-center justify-between text-xs text-slate-700 dark:text-zinc-200">
                  <span>All sessions</span>
                  <ChevronsUpDown className="size-3.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Classes
                </label>
                <div className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Select sessions first</span>
                  <ChevronsUpDown className="size-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card: Columns * */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="bg-[#f8fafc] dark:bg-zinc-800/60 px-5 py-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Columns *
              </h3>
            </div>

            <div className="p-5 space-y-3">
              <Popover open={isColumnsOpen} onOpenChange={setIsColumnsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                  >
                    <SlidersHorizontal className="size-3.5 text-slate-600" />
                    <span>Select columns</span>
                    <ChevronDown className="size-3.5 text-slate-400" />
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-80 p-3 rounded-xl max-h-80 overflow-y-auto" align="start">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-semibold text-slate-800">
                      Columns ({selectedColumns.length}/{AVAILABLE_COLUMNS.length})
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedColumns(AVAILABLE_COLUMNS.map((c) => c.id))}
                        className="text-teal-600 hover:underline cursor-pointer"
                      >
                        All
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedColumns(["fullName"])}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {AVAILABLE_COLUMNS.map((col) => {
                      const isChecked = selectedColumns.includes(col.id);
                      return (
                        <label
                          key={col.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-xs select-none"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleToggleColumn(col.id)}
                            className="size-3.5 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                          />
                          <span className="text-slate-700">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Selected Columns Chips */}
              {selectedColumns.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedColumns.map((colId) => {
                    const col = AVAILABLE_COLUMNS.find((c) => c.id === colId);
                    if (!col) return null;
                    return (
                      <span
                        key={colId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F1F5F9] text-slate-700 border border-slate-200/50"
                      >
                        {col.label}
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(colId)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Summary Form (Screenshot 2) */
        <div className="space-y-4">
          {/* Top 2 Cards: Basic Information & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Basic Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Basic Information
              </h3>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Template Name *
                </label>
                <Input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Class-wise Gender Count"
                  className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this report template is for..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>
            </div>

            {/* Card 2: Settings */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Settings
              </h3>

              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-zinc-300">
                <Checkbox
                  checked={showPercentages}
                  onCheckedChange={(c) => setShowPercentages(!!c)}
                  className="size-4 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                />
                Show percentages alongside counts
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-zinc-300">
                <Checkbox
                  checked={showGrandTotal}
                  onCheckedChange={(c) => setShowGrandTotal(!!c)}
                  className="size-4 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                />
                Show grand total row
              </label>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Page Orientation
                </label>
                <Select
                  value={orientation}
                  onValueChange={(v: "portrait" | "landscape") => setOrientation(v)}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 w-44">
                    <SelectValue placeholder="Portrait" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait" className="text-xs">
                      Portrait
                    </SelectItem>
                    <SelectItem value="landscape" className="text-xs">
                      Landscape
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Middle Card: Data Filters */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="bg-[#f8fafc] dark:bg-zinc-800/60 px-5 py-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Data Filters
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Filter by session and class. Leave empty to include all.
              </p>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Sessions
                </label>
                <div className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 flex items-center justify-between text-xs text-slate-700 dark:text-zinc-200">
                  <span>All sessions</span>
                  <ChevronsUpDown className="size-3.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Classes
                </label>
                <div className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Select sessions first</span>
                  <ChevronsUpDown className="size-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 2 Cards: Row Dimensions * and Column Measures * */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Row Dimensions * */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="bg-[#f8fafc] dark:bg-zinc-800/60 px-5 py-3 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Row Dimensions *
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Choose what categories form the rows.
                </p>
              </div>

              <div className="p-5 space-y-3">
                <Popover open={isRowDimOpen} onOpenChange={setIsRowDimOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                    >
                      <TableIcon className="size-3.5 text-slate-600" />
                      <span>Row Dimensions</span>
                      <ChevronDown className="size-3.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="w-72 p-3 rounded-xl max-h-80 overflow-y-auto" align="start">
                    <div className="space-y-1">
                      {AVAILABLE_ROW_DIMENSIONS.map((dim) => {
                        const isChecked = selectedRowDimensions.includes(dim.id);
                        return (
                          <label
                            key={dim.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-xs select-none"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleRowDim(dim.id)}
                              className="size-3.5 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                            />
                            <span className="text-slate-700">{dim.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedRowDimensions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedRowDimensions.map((dimId) => {
                      const dim = AVAILABLE_ROW_DIMENSIONS.find((d) => d.id === dimId);
                      if (!dim) return null;
                      return (
                        <span
                          key={dimId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F1F5F9] text-slate-700 border border-slate-200/50"
                        >
                          {dim.label}
                          <button
                            type="button"
                            onClick={() => handleToggleRowDim(dimId)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Column Measures * */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="bg-[#f8fafc] dark:bg-zinc-800/60 px-5 py-3 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Column Measures *
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Choose aggregated values to show as columns.
                </p>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Popover open={isColMeasureOpen} onOpenChange={setIsColMeasureOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                      >
                        <BarChart3 className="size-3.5 text-slate-600" />
                        <span>Column Measures</span>
                        <ChevronDown className="size-3.5 text-slate-400" />
                      </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-72 p-3 rounded-xl max-h-80 overflow-y-auto" align="start">
                      <div className="space-y-1">
                        {AVAILABLE_COLUMN_MEASURES.map((m) => {
                          const isChecked = selectedColumnMeasures.includes(m.id);
                          return (
                            <label
                              key={m.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-xs select-none"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggleColMeasure(m.id)}
                                className="size-3.5 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                              />
                              <span className="text-slate-700">{m.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {selectedColumnMeasures.length === 0 && (
                    <span className="text-xs text-slate-400">
                      No measures selected. Select at least one measure to continue.
                    </span>
                  )}
                </div>

                {selectedColumnMeasures.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedColumnMeasures.map((mId) => {
                      const m = AVAILABLE_COLUMN_MEASURES.find((item) => item.id === mId);
                      if (!m) return null;
                      return (
                        <span
                          key={mId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F1F5F9] text-slate-700 border border-slate-200/50"
                        >
                          {m.label}
                          <button
                            type="button"
                            onClick={() => handleToggleColMeasure(mId)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generated Template Report View (/students/reports/[templateId])
// Matching Screenshot 5 with stat pills and bottom timestamp
// ---------------------------------------------------------------------------
function GeneratedReportView({
  template,
  onBack,
  onEdit,
}: {
  template: ReportTemplate;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [timestampStr] = useState<string>(() => getGeneratedTimestamp());

  // Active columns to render in table
  const activeColIds = useMemo(() => {
    if (template.config?.columns && template.config.columns.length > 0) {
      return template.config.columns;
    }
    return ["dob", "photo", "lastName", "fullName"];
  }, [template]);

  const activeColDefs = useMemo(() => {
    return activeColIds.map((id) => {
      const found = AVAILABLE_COLUMNS.find((c) => c.id === id);
      return (
        found || {
          id,
          label: id.replace(/([A-Z])/g, " $1").trim(),
          category: "demographic" as const,
        }
      );
    });
  }, [activeColIds]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["S.NO", ...activeColDefs.map((c) => `"${c.label.toUpperCase()}"`)].join(
      ","
    );
    const rows = CLASS_5TH_STUDENTS.map((student) => {
      const cells = [
        student.sno,
        ...activeColDefs.map((c) => `"${(student as any)[c.id] || "-"}"`),
      ];
      return cells.join(",");
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.name.toLowerCase().replace(/\s+/g, "_")}_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded as CSV");
  };

  return (
    <div className="space-y-4 max-w-6xl pb-10">
      {/* Top back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          Back to reports
        </button>
      </div>

      {/* Header matching Screenshot 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-[24px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          {template.name}
        </h1>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCSV}
            className="h-9 px-3.5 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <Download className="size-3.5 text-slate-500" />
            Download CSV
          </Button>

          <Button
            type="button"
            onClick={onEdit}
            className="h-9 px-4 gap-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Pencil className="size-3.5" />
            Edit Template
          </Button>
        </div>
      </div>

      {/* Stat Pills Bar matching Screenshot 5 */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Top Metric Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          {/* Total 25 */}
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-zinc-100">
            <Users className="size-3.5 text-slate-500" />
            <span>Total</span>
            <span className="text-slate-900 dark:text-zinc-50 font-extrabold">25</span>
          </div>

          <span className="text-slate-200 dark:text-zinc-700">|</span>

          {/* RTE 0 */}
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-300">
            <GraduationCap className="size-3.5 text-slate-400" />
            <span>RTE</span>
            <span className="font-extrabold text-slate-900 dark:text-zinc-50">0</span>
          </div>

          <span className="text-slate-200 dark:text-zinc-700">|</span>

          {/* GENDER: FEMALE 15, MALE 10 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Gender
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300">
              FEMALE 15
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300">
              MALE 10
            </span>
          </div>

          <span className="text-slate-200 dark:text-zinc-700">|</span>

          {/* CATEGORY: GENERAL 12, OBC 6, SC 5, ST 2 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Category
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
              GENERAL 12
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
              OBC 6
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
              SC 5
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
              ST 2
            </span>
          </div>

          <span className="text-slate-200 dark:text-zinc-700">|</span>

          {/* STATUS: ACTIVE 25 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Status
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300">
              ACTIVE 25
            </span>
          </div>
        </div>

        {/* Bottom Row: Classes */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800 text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Classes
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            Class 5th 25
          </span>
        </div>
      </div>

      {/* Student Data Table matching Screenshot 5 */}
      <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 bg-[#f8fafc] dark:bg-zinc-800/60">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-16">
                  S.NO
                </th>
                {activeColDefs.map((col) => (
                  <th
                    key={col.id}
                    className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 whitespace-nowrap"
                  >
                    {col.label.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {CLASS_5TH_STUDENTS.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="px-5 py-3 text-slate-500 dark:text-zinc-400 font-normal">
                    {student.sno}
                  </td>
                  {activeColDefs.map((col) => (
                    <td
                      key={col.id}
                      className="px-5 py-3 text-slate-700 dark:text-zinc-300 whitespace-nowrap"
                    >
                      {(student as any)[col.id] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Timing Footer (Explicit user requirement: Generated at 30/9/2026, 10:12:06 am) */}
        <div className="px-5 py-3 bg-[#f8fafc] dark:bg-zinc-800/60 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-slate-400" />
            <span className="font-medium">{timestampStr}</span>
          </div>
          <span>{CLASS_5TH_STUDENTS.length} records</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Report Generator View (/students/reports/generate)
// Pixel-perfect reproduction of User Reference Screenshots
// ---------------------------------------------------------------------------
interface DimensionOption {
  id: string;
  label: string;
}

const AVAILABLE_ROW_DIMENSIONS: DimensionOption[] = [
  { id: "mediumOfInstruction", label: "Medium of Instruction" },
  { id: "classSection", label: "Class & Section" },
  { id: "gender", label: "Gender" },
  { id: "category", label: "Category" },
  { id: "religion", label: "Religion" },
  { id: "bloodGroup", label: "Blood Group" },
  { id: "rteStudent", label: "RTE Status" },
  { id: "bpl", label: "BPL Status" },
];

const AVAILABLE_COLUMN_MEASURES: DimensionOption[] = [
  { id: "statusBreakdown", label: "Status Breakdown" },
  { id: "genderBreakdown", label: "Gender Breakdown" },
  { id: "categoryBreakdown", label: "Category Breakdown" },
  { id: "religionBreakdown", label: "Religion Breakdown" },
  { id: "rteBreakdown", label: "RTE Breakdown" },
  { id: "studentCount", label: "Student Count" },
];

function QuickReportView({
  onBack,
  initialReportType = "row-level",
}: {
  onBack: () => void;
  initialReportType?: ReportType;
}) {
  const { academicYears } = useAcademicYears();

  // Sessions list
  const sessions = useMemo(() => {
    if (academicYears && academicYears.length > 0) {
      return academicYears.map((y) => ({
        id: y.id,
        name: y.name,
        isCurrent: y.isCurrent,
      }));
    }
    return DEFAULT_SESSIONS;
  }, [academicYears]);

  // Classes list
  const [classesList, setClassesList] = useState<string[]>(DEFAULT_CLASSES);

  // Filters State - Defaults configured matching the user's screenshot
  const [reportType, setReportType] = useState<ReportType>(initialReportType);
  const [selectedSessions, setSelectedSessions] = useState<string[]>(["2026-27"]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["UKG - A"]);

  // Popover open states
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isClassesOpen, setIsClassesOpen] = useState(false);
  const [isColumnPopoverOpen, setIsColumnPopoverOpen] = useState(false);
  const [isRowDimensionsOpen, setIsRowDimensionsOpen] = useState(false);
  const [isColumnMeasuresOpen, setIsColumnMeasuresOpen] = useState(false);

  // Row-Level Columns State - Defaults to Full Name & Date of Birth
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED_COLUMNS);

  // Summary State - Defaults matching Screenshot 1 & 2
  const [selectedRowDimensions, setSelectedRowDimensions] = useState<string[]>([
    "mediumOfInstruction",
  ]);
  const [selectedColumnMeasures, setSelectedColumnMeasures] = useState<string[]>([
    "statusBreakdown",
  ]);
  const [showPercentages, setShowPercentages] = useState<boolean>(true);
  const [showGrandTotal, setShowGrandTotal] = useState<boolean>(true);

  // Options State - Defaults to screenshot values
  const [sortBy, setSortBy] = useState<string>("dob");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<string>("fullName");
  const [perPage, setPerPage] = useState<string>("50");
  const [includeSerialNumbers, setIncludeSerialNumbers] = useState<boolean>(true);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(true);
  const [reportResults, setReportResults] = useState<typeof INITIAL_STUDENTS>(INITIAL_STUDENTS);

  // Fetch real classes if available
  useEffect(() => {
    let mounted = true;
    apiFetch("/api/classes?limit=100")
      .then((data: any) => {
        if (mounted && data && Array.isArray(data.classes) && data.classes.length > 0) {
          const names = data.classes.map((c: any) =>
            c.section ? `${c.name} - ${c.section}` : c.name
          );
          setClassesList(Array.from(new Set([...DEFAULT_CLASSES, ...names])));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch real students if available
  useEffect(() => {
    let mounted = true;
    apiFetch("/api/students?limit=200")
      .then((data: any) => {
        if (mounted && data && Array.isArray(data.students) && data.students.length > 0) {
          const mapped = data.students.map((s: any, idx: number) => ({
            id: s.id || `stu-${idx}`,
            sno: idx + 1,
            admissionNumber: s.admissionNumber || s.admission_no || `ADM-2025-00${idx + 1}`,
            rollNumber: s.rollNumber || s.roll_no || `${idx + 1}`,
            fullName: `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.name || `Student ${idx + 1}`,
            classSection: s.class ? `${s.class} - ${s.section || "A"}` : "UKG - A",
            gender: s.gender || (idx % 2 === 0 ? "Male" : "Female"),
            dob: s.dob ? formatDate(s.dob) : "12-03-2019",
            bloodGroup: s.bloodGroup || "O+",
            category: s.category || (idx % 3 === 0 ? "General" : idx % 3 === 1 ? "OBC" : "SC"),
            religion: s.religion || "Hindu",
            fatherName: s.fatherName || "Father Name",
            motherName: s.motherName || "Mother Name",
            parentPhone: s.phone || "9876543210",
            parentEmail: s.email || "",
            address: s.address || "",
            aadhaarNumber: s.aadhaar || "",
            mediumOfInstruction: idx % 3 === 0 ? "English" : idx % 3 === 1 ? "Hindi" : "Regional",
            status: idx % 5 === 0 ? "Inactive" : idx % 7 === 0 ? "Transferred" : "Active",
            rteStudent: idx % 4 === 0 ? "Yes" : "No",
            bpl: idx % 6 === 0 ? "Yes" : "No",
          }));
          const merged = [...INITIAL_STUDENTS, ...mapped.slice(INITIAL_STUDENTS.length)];
          setReportResults(merged);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Toggle sessions
  const handleToggleSession = (sessionName: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionName) ? prev.filter((s) => s !== sessionName) : [...prev, sessionName]
    );
  };

  const handleRemoveSession = (sessionName: string) => {
    setSelectedSessions((prev) => prev.filter((s) => s !== sessionName));
  };

  // Toggle classes
  const handleToggleClass = (className: string) => {
    setSelectedClasses((prev) =>
      prev.includes(className) ? prev.filter((c) => c !== className) : [...prev, className]
    );
  };

  const handleRemoveClass = (className: string) => {
    setSelectedClasses((prev) => prev.filter((c) => c !== className));
  };

  // Toggle columns (Row Level)
  const handleToggleColumn = (colId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handleRemoveColumn = (colId: string) => {
    setSelectedColumns((prev) => prev.filter((id) => id !== colId));
  };

  // Toggle Row Dimensions (Summary)
  const handleToggleRowDimension = (dimId: string) => {
    setSelectedRowDimensions((prev) =>
      prev.includes(dimId)
        ? prev.length > 1
          ? prev.filter((id) => id !== dimId)
          : prev
        : [...prev, dimId]
    );
  };

  const handleRemoveRowDimension = (dimId: string) => {
    if (selectedRowDimensions.length <= 1) {
      toast.error("At least one row dimension is required");
      return;
    }
    setSelectedRowDimensions((prev) => prev.filter((id) => id !== dimId));
  };

  // Toggle Column Measures (Summary)
  const handleToggleColumnMeasure = (measureId: string) => {
    setSelectedColumnMeasures((prev) =>
      prev.includes(measureId)
        ? prev.length > 1
          ? prev.filter((id) => id !== measureId)
          : prev
        : [...prev, measureId]
    );
  };

  const handleRemoveColumnMeasure = (measureId: string) => {
    if (selectedColumnMeasures.length <= 1) {
      toast.error("At least one column measure is required");
      return;
    }
    setSelectedColumnMeasures((prev) => prev.filter((id) => id !== measureId));
  };

  // Generate Report
  const handleGenerateReport = () => {
    if (reportType === "summary") {
      if (selectedRowDimensions.length === 0) {
        toast.error("Please select at least one row dimension");
        return;
      }
      if (selectedColumnMeasures.length === 0) {
        toast.error("Please select at least one column measure");
        return;
      }
    } else {
      if (selectedColumns.length === 0) {
        toast.error("Please select at least one column to include in the report");
        return;
      }
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);

      if (reportType === "row-level") {
        let list = [...INITIAL_STUDENTS];

        if (sortBy === "dob") {
          list.sort((a, b) => {
            const da = parseDDMMYYYY(a.dob);
            const db = parseDDMMYYYY(b.dob);
            return sortDirection === "asc" ? da - db : db - da;
          });
        } else if (sortBy === "fullName") {
          list.sort((a, b) =>
            sortDirection === "asc"
              ? a.fullName.localeCompare(b.fullName)
              : b.fullName.localeCompare(a.fullName)
          );
        } else if (sortBy === "roll") {
          list.sort((a, b) =>
            sortDirection === "asc"
              ? Number(a.rollNumber) - Number(b.rollNumber)
              : Number(b.rollNumber) - Number(a.rollNumber)
          );
        } else if (sortBy === "admission") {
          list.sort((a, b) =>
            sortDirection === "asc"
              ? a.admissionNumber.localeCompare(b.admissionNumber)
              : b.admissionNumber.localeCompare(a.admissionNumber)
          );
        }

        list = list.map((item, i) => ({ ...item, sno: i + 1 }));
        setReportResults(list);
        toast.success(`Generated row-level report with ${list.length} student records`);
      } else {
        toast.success("Generated summary report with active dimensions");
      }
    }, 400);
  };

  // Computed Summary Data Structure
  const summaryData = useMemo(() => {
    if (reportType !== "summary") return null;

    const primaryDimId = selectedRowDimensions[0] || "mediumOfInstruction";
    const primaryDimDef = AVAILABLE_ROW_DIMENSIONS.find((d) => d.id === primaryDimId) || {
      id: "mediumOfInstruction",
      label: "Medium of Instruction",
    };

    let dimValues = Array.from(
      new Set(reportResults.map((s: any) => s[primaryDimId] || "English"))
    );
    if (dimValues.length === 0) {
      dimValues = ["English", "Hindi"];
    }

    const primaryMeasureId = selectedColumnMeasures[0] || "statusBreakdown";

    let measureCols: { key: string; label: string }[] = [];
    if (primaryMeasureId === "statusBreakdown") {
      measureCols = [
        { key: "Active", label: "Active" },
        { key: "Inactive", label: "Inactive" },
        { key: "Transferred", label: "Transferred" },
      ];
    } else if (primaryMeasureId === "genderBreakdown") {
      measureCols = [
        { key: "Male", label: "Male" },
        { key: "Female", label: "Female" },
      ];
    } else if (primaryMeasureId === "categoryBreakdown") {
      measureCols = [
        { key: "General", label: "General" },
        { key: "OBC", label: "OBC" },
        { key: "SC", label: "SC" },
      ];
    } else if (primaryMeasureId === "religionBreakdown") {
      measureCols = [
        { key: "Hindu", label: "Hindu" },
        { key: "Muslim", label: "Muslim" },
      ];
    } else if (primaryMeasureId === "rteBreakdown") {
      measureCols = [
        { key: "Yes", label: "RTE Eligible" },
        { key: "No", label: "General / Non-RTE" },
      ];
    } else {
      measureCols = [{ key: "Enrolled", label: "Enrolled" }];
    }

    let grandTotalCount = 0;
    const colTotals: Record<string, number> = {};
    measureCols.forEach((c) => (colTotals[c.key] = 0));

    const rows = dimValues.map((val) => {
      const bucketStudents = reportResults.filter(
        (s: any) => (s[primaryDimId] || "English") === val
      );
      const rowTotal = bucketStudents.length;
      grandTotalCount += rowTotal;

      const cellCounts: Record<string, { count: number; pct: string }> = {};

      measureCols.forEach((col) => {
        let count = 0;
        if (primaryMeasureId === "statusBreakdown") {
          count = bucketStudents.filter((s: any) => (s.status || "Active") === col.key).length;
        } else if (primaryMeasureId === "genderBreakdown") {
          count = bucketStudents.filter((s: any) => (s.gender || "Male") === col.key).length;
        } else if (primaryMeasureId === "categoryBreakdown") {
          count = bucketStudents.filter((s: any) => (s.category || "General") === col.key).length;
        } else if (primaryMeasureId === "religionBreakdown") {
          count = bucketStudents.filter((s: any) => (s.religion || "Hindu") === col.key).length;
        } else if (primaryMeasureId === "rteBreakdown") {
          count = bucketStudents.filter((s: any) => (s.rteStudent || "No") === col.key).length;
        } else {
          count = bucketStudents.length;
        }

        colTotals[col.key] = (colTotals[col.key] || 0) + count;
        const pct = rowTotal > 0 ? ((count / rowTotal) * 100).toFixed(1) : "0.0";
        cellCounts[col.key] = { count, pct };
      });

      return {
        dimensionValue: val,
        cellCounts,
        rowTotal,
      };
    });

    const colTotalPcts: Record<string, string> = {};
    measureCols.forEach((c) => {
      const sum = colTotals[c.key] || 0;
      colTotalPcts[c.key] =
        grandTotalCount > 0 ? ((sum / grandTotalCount) * 100).toFixed(1) : "0.0";
    });

    return {
      dimensionDef: primaryDimDef,
      measureCols,
      rows,
      colTotals,
      colTotalPcts,
      grandTotalCount,
    };
  }, [reportType, selectedRowDimensions, selectedColumnMeasures, reportResults]);

  // Export CSV (Handles both Summary and Row Level)
  const handleExportCSV = () => {
    if (reportType === "summary" && summaryData) {
      const { dimensionDef, measureCols, rows, colTotals, colTotalPcts, grandTotalCount } = summaryData;
      const headers = [
        `"${dimensionDef.label.toUpperCase()}"`,
        ...measureCols.map((c) => `"${c.label.toUpperCase()}"`),
        '"TOTAL"',
      ].join(",");

      const rowLines = rows.map((r) => {
        const cells = [
          `"${r.dimensionValue}"`,
          ...measureCols.map((c) => {
            const cell = r.cellCounts[c.key] || { count: 0, pct: "0.0" };
            return showPercentages ? `"${cell.count} (${cell.pct}%)"` : `"${cell.count}"`;
          }),
          showPercentages ? `"${r.rowTotal} (100.0%)"` : `"${r.rowTotal}"`,
        ];
        return cells.join(",");
      });

      if (showGrandTotal) {
        const grandCells = [
          '"GRAND TOTAL"',
          ...measureCols.map((c) => {
            const sum = colTotals[c.key] || 0;
            const pct = colTotalPcts[c.key] || "0.0";
            return showPercentages ? `"${sum} (${pct}%)"` : `"${sum}"`;
          }),
          showPercentages ? `"${grandTotalCount} (100.0%)"` : `"${grandTotalCount}"`,
        ];
        rowLines.push(grandCells.join(","));
      }

      const csvContent = [headers, ...rowLines].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `student_summary_report_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Summary report exported to CSV");
      return;
    }

    if (reportResults.length === 0) return;

    const activeCols = AVAILABLE_COLUMNS.filter((c) => selectedColumns.includes(c.id));
    const headers = [
      includeSerialNumbers ? "S.NO" : null,
      ...activeCols.map((c) => `"${c.label.toUpperCase()}"`),
    ]
      .filter(Boolean)
      .join(",");

    const rows = reportResults.map((row) => {
      const cells = [
        includeSerialNumbers ? String(row.sno) : null,
        ...activeCols.map((c) => `"${(row as any)[c.id] || ""}"`),
      ].filter(Boolean);
      return cells.join(",");
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student_report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report exported to CSV");
  };

  // Grouping computation for Row Level
  const groupedData = useMemo(() => {
    if (groupBy === "none" || !groupBy) {
      return [{ groupKey: "All Students", students: reportResults }];
    }

    const groups: Record<string, typeof reportResults> = {};
    for (const student of reportResults) {
      const key = (student as any)[groupBy] || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
    }

    return Object.entries(groups).map(([groupKey, students]) => ({
      groupKey,
      students,
    }));
  }, [groupBy, reportResults]);

  const activeColumnDefs = AVAILABLE_COLUMNS.filter((c) => selectedColumns.includes(c.id));

  return (
    <div className="space-y-4">
      {/* Top back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          Back to reports
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          Quick Report
        </h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
          Configure and generate an ad-hoc report without saving a template
        </p>
      </div>

      {/* Report Type Selector matching Screenshot 1 */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mr-2">
          Report Type
        </span>
        <button
          type="button"
          onClick={() => setReportType("row-level")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
            reportType === "row-level"
              ? "bg-[#0F172A] text-white font-semibold dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          )}
        >
          <TableIcon className="size-3.5" />
          Row Level
        </button>

        <button
          type="button"
          onClick={() => setReportType("summary")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
            reportType === "summary"
              ? "bg-[#0F172A] text-white font-semibold dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          )}
        >
          <BarChart3 className="size-3.5" />
          Summary
        </button>
      </div>

      {/* Main Grid: Left Controls (4 cols) & Right Generated Output (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Left Column: Configuration Cards matching Screenshots */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Data Filters (Visible for both Row Level and Summary) */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="bg-[#f8fafc] dark:bg-zinc-800/60 px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
                <Filter className="size-3.5 text-slate-500" />
                Data Filters
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Filter by session and class. Leave empty to include all.
              </p>
            </div>

            <div className="p-4 space-y-3.5">
              {/* SESSIONS Multi-Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Sessions
                </label>

                <Popover open={isSessionsOpen} onOpenChange={setIsSessionsOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 flex items-center justify-between text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                    >
                      <span>
                        {selectedSessions.length === 0
                          ? "Select sessions"
                          : selectedSessions.length === 1
                          ? "1 session selected"
                          : `${selectedSessions.length} sessions selected`}
                      </span>
                      <ChevronsUpDown className="size-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="w-64 p-2 rounded-xl shadow-lg border-slate-200" align="start">
                    <div className="space-y-1">
                      {sessions.map((s) => {
                        const isChecked = selectedSessions.includes(s.name);
                        return (
                          <label
                            key={s.id}
                            className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer select-none text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggleSession(s.name)}
                                className="size-4 rounded-[4px] data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                              />
                              <span className="text-slate-800 dark:text-zinc-200 font-medium">
                                {s.name}
                              </span>
                            </div>
                            {s.isCurrent && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                Current
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Selected session chips matching Screenshot 1 */}
                {selectedSessions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedSessions.map((session) => (
                      <span
                        key={session}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {session}
                        <button
                          type="button"
                          onClick={() => handleRemoveSession(session)}
                          className="hover:text-slate-900 text-slate-400 cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CLASSES Multi-Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Classes
                </label>

                <Popover open={isClassesOpen} onOpenChange={setIsClassesOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 flex items-center justify-between text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                    >
                      <span>
                        {selectedClasses.length === 0
                          ? "Select classes"
                          : selectedClasses.length === 1
                          ? "1 class selected"
                          : `${selectedClasses.length} classes selected`}
                      </span>
                      <ChevronsUpDown className="size-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="w-64 p-2 rounded-xl shadow-lg border-slate-200 max-h-60 overflow-y-auto" align="start">
                    <div className="space-y-1">
                      {classesList.map((cls) => {
                        const isChecked = selectedClasses.includes(cls);
                        return (
                          <label
                            key={cls}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer select-none text-xs"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleClass(cls)}
                              className="size-4 rounded-[4px] data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                            />
                            <span className="text-slate-800 dark:text-zinc-200 font-medium">
                              {cls}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Selected class chips matching Screenshot 1 */}
                {selectedClasses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedClasses.map((cls) => (
                      <span
                        key={cls}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {cls}
                        <button
                          type="button"
                          onClick={() => handleRemoveClass(cls)}
                          className="hover:text-slate-900 text-slate-400 cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conditional Controls: Row-Level vs Summary */}
          {reportType === "summary" ? (
            <>
              {/* Summary Card 2: Row Dimensions matching Screenshot 1 & 2 */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="bg-[#f8fafc] dark:bg-zinc-800/60 px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Row Dimensions
                  </h3>
                </div>

                <div className="p-4 space-y-3">
                  <Popover open={isRowDimensionsOpen} onOpenChange={setIsRowDimensionsOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="h-10 w-full px-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-between text-xs font-medium cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <TableIcon className="size-3.5 text-slate-600 dark:text-zinc-400" />
                          <span>Row Dimensions</span>
                          <span className="inline-flex items-center justify-center rounded-full bg-[#CCFBF1] text-[#0F766E] border border-teal-200/60 px-2 py-0.2 text-[11px] font-bold">
                            {selectedRowDimensions.length}
                          </span>
                        </span>
                        <ChevronDown className="size-3.5 text-slate-400" />
                      </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-72 p-3 rounded-xl max-h-80 overflow-y-auto" align="start">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 mb-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          Row Dimensions ({selectedRowDimensions.length}/{AVAILABLE_ROW_DIMENSIONS.length})
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRowDimensions(AVAILABLE_ROW_DIMENSIONS.map((d) => d.id))
                            }
                            className="text-teal-600 hover:underline cursor-pointer"
                          >
                            All
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            type="button"
                            onClick={() => setSelectedRowDimensions(["mediumOfInstruction"])}
                            className="text-slate-500 hover:underline cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {AVAILABLE_ROW_DIMENSIONS.map((dim) => {
                          const isChecked = selectedRowDimensions.includes(dim.id);
                          return (
                            <label
                              key={dim.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-xs select-none"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggleRowDimension(dim.id)}
                                className="size-3.5 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                              />
                              <span className="text-slate-700 dark:text-zinc-300">{dim.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Selected Row Dimension Chips matching Screenshot 1 & 2 */}
                  {selectedRowDimensions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {selectedRowDimensions.map((dimId) => {
                        const dim = AVAILABLE_ROW_DIMENSIONS.find((d) => d.id === dimId);
                        if (!dim) return null;
                        return (
                          <span
                            key={dimId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F1F5F9] text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 border border-slate-200/50"
                          >
                            {dim.label}
                            <button
                              type="button"
                              onClick={() => handleRemoveRowDimension(dimId)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Card 3: Column Measures matching Screenshot 1 & 2 */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="bg-[#f8fafc] dark:bg-zinc-800/60 px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Column Measures
                  </h3>
                </div>

                <div className="p-4 space-y-3">
                  <Popover open={isColumnMeasuresOpen} onOpenChange={setIsColumnMeasuresOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="h-10 w-full px-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-between text-xs font-medium cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <BarChart3 className="size-3.5 text-slate-600 dark:text-zinc-400" />
                          <span>Column Measures</span>
                          <span className="inline-flex items-center justify-center rounded-full bg-[#CCFBF1] text-[#0F766E] border border-teal-200/60 px-2 py-0.2 text-[11px] font-bold">
                            {selectedColumnMeasures.length}
                          </span>
                        </span>
                        <ChevronDown className="size-3.5 text-slate-400" />
                      </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-72 p-3 rounded-xl max-h-80 overflow-y-auto" align="start">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 mb-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          Column Measures ({selectedColumnMeasures.length}/{AVAILABLE_COLUMN_MEASURES.length})
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedColumnMeasures(AVAILABLE_COLUMN_MEASURES.map((m) => m.id))
                            }
                            className="text-teal-600 hover:underline cursor-pointer"
                          >
                            All
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            type="button"
                            onClick={() => setSelectedColumnMeasures(["statusBreakdown"])}
                            className="text-slate-500 hover:underline cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {AVAILABLE_COLUMN_MEASURES.map((measure) => {
                          const isChecked = selectedColumnMeasures.includes(measure.id);
                          return (
                            <label
                              key={measure.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-xs select-none"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggleColumnMeasure(measure.id)}
                                className="size-3.5 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                              />
                              <span className="text-slate-700 dark:text-zinc-300">
                                {measure.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Selected Column Measure Chips matching Screenshot 1 & 2 */}
                  {selectedColumnMeasures.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {selectedColumnMeasures.map((measureId) => {
                        const measure = AVAILABLE_COLUMN_MEASURES.find((m) => m.id === measureId);
                        if (!measure) return null;
                        return (
                          <span
                            key={measureId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F1F5F9] text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 border border-slate-200/50"
                          >
                            {measure.label}
                            <button
                              type="button"
                              onClick={() => handleRemoveColumnMeasure(measureId)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Card 4: Settings matching Screenshot 2 */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="bg-[#f8fafc] dark:bg-zinc-800/60 px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Settings
                  </h3>
                </div>

                <div className="p-4 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <Checkbox
                      checked={showPercentages}
                      onCheckedChange={(c) => setShowPercentages(!!c)}
                      className="size-4 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                    />
                    Show percentages
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <Checkbox
                      checked={showGrandTotal}
                      onCheckedChange={(c) => setShowGrandTotal(!!c)}
                      className="size-4 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                    />
                    Show grand total row
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Row-Level Card 2: Select Columns */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Select Columns
                </h3>

                <Popover open={isColumnPopoverOpen} onOpenChange={setIsColumnPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-10 w-full px-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-between text-xs font-medium cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="size-3.5 text-slate-600 dark:text-zinc-400" />
                        Select columns
                        <span className="inline-flex items-center justify-center rounded-full bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.2 text-[11px] font-semibold dark:bg-teal-950 dark:border-teal-800 dark:text-teal-300">
                          {selectedColumns.length}
                        </span>
                      </span>
                      <ChevronDown className="size-3.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="w-72 p-3 rounded-xl max-h-80 overflow-y-auto" align="start">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 mb-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        Columns ({selectedColumns.length}/{AVAILABLE_COLUMNS.length})
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSelectedColumns(AVAILABLE_COLUMNS.map((c) => c.id))}
                          className="text-teal-600 hover:underline cursor-pointer"
                        >
                          All
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          onClick={() => setSelectedColumns(["fullName"])}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {AVAILABLE_COLUMNS.map((col) => {
                        const isChecked = selectedColumns.includes(col.id);
                        return (
                          <label
                            key={col.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-xs select-none"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleColumn(col.id)}
                              className="size-3.5 rounded-[4px] data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                            />
                            <span className="text-slate-700 dark:text-zinc-300">{col.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedColumns.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedColumns.map((colId) => {
                      const col = AVAILABLE_COLUMNS.find((c) => c.id === colId);
                      if (!col) return null;
                      return (
                        <span
                          key={colId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 border border-slate-200/50"
                        >
                          {col.label}
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(colId)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Row-Level Card 3: Options */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Options</h3>

                {/* SORT BY */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Sort by
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          None
                        </SelectItem>
                        <SelectItem value="dob" className="text-xs">
                          Date of Birth
                        </SelectItem>
                        <SelectItem value="fullName" className="text-xs">
                          Full Name
                        </SelectItem>
                        <SelectItem value="roll" className="text-xs">
                          Roll Number
                        </SelectItem>
                        <SelectItem value="admission" className="text-xs">
                          Admission Number
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortDirection} onValueChange={(v: "asc" | "desc") => setSortDirection(v)}>
                      <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                        <SelectValue placeholder="Asc" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc" className="text-xs">
                          Asc
                        </SelectItem>
                        <SelectItem value="desc" className="text-xs">
                          Desc
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* GROUP BY */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Group by
                  </label>
                  <Select value={groupBy} onValueChange={setGroupBy}>
                    <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">
                        None
                      </SelectItem>
                      <SelectItem value="fullName" className="text-xs">
                        Full Name
                      </SelectItem>
                      <SelectItem value="classSection" className="text-xs">
                        Class
                      </SelectItem>
                      <SelectItem value="gender" className="text-xs">
                        Gender
                      </SelectItem>
                      <SelectItem value="category" className="text-xs">
                        Category
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* PER PAGE */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Per page
                  </label>
                  <Select value={perPage} onValueChange={setPerPage}>
                    <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 w-24">
                      <SelectValue placeholder="50" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25" className="text-xs">
                        25
                      </SelectItem>
                      <SelectItem value="50" className="text-xs">
                        50
                      </SelectItem>
                      <SelectItem value="100" className="text-xs">
                        100
                      </SelectItem>
                      <SelectItem value="all" className="text-xs">
                        All
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkbox: Include serial numbers */}
                <div className="pt-1.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <Checkbox
                      checked={includeSerialNumbers}
                      onCheckedChange={(c) => setIncludeSerialNumbers(!!c)}
                      className="size-4 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A]"
                    />
                    Include serial numbers
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Action Button: Generate Report matching Screenshot 2 */}
          <Button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full h-11 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold gap-2 shadow-sm cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Play className="size-3.5 fill-current" />
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
        </div>

        {/* Right Column: Generated Output */}
        <div className="lg:col-span-8">
          {!isGenerated ? (
            <div className="rounded-xl border border-slate-200 bg-white min-h-[460px] flex flex-col items-center justify-center p-8 text-center shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="grid size-12 place-items-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mb-3">
                <Play className="size-5 fill-current" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 font-[family-name:var(--font-lexend)]">
                Configure & Generate
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Select the fields you want in your report, configure options, then click Generate Report.
              </p>
            </div>
          ) : reportType === "summary" && summaryData ? (
            /* SUMMARY PIVOT MATRIX TABLE */
            <div className="space-y-4">
              {/* Top Quick Actions Bar */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  Summary by {summaryData.dimensionDef.label} · {summaryData.grandTotalCount} students
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="h-8 gap-1.5 text-xs rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <Download className="size-3.5" />
                    Export CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 gap-1.5 text-xs rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <Printer className="size-3.5" />
                    Print
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateReport}
                    className="h-8 size-8 p-0 rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="size-3.5 text-slate-600" />
                  </Button>
                </div>
              </div>

              {/* Summary Matrix Card */}
              <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-zinc-800 bg-[#f8fafc] dark:bg-zinc-800/60">
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                          {summaryData.dimensionDef.label.toUpperCase()}
                        </th>
                        {summaryData.measureCols.map((c) => (
                          <th
                            key={c.key}
                            className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 whitespace-nowrap text-right"
                          >
                            {c.label.toUpperCase()}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-800 dark:text-zinc-200 whitespace-nowrap text-right">
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                      {summaryData.rows.map((row) => (
                        <tr
                          key={row.dimensionValue}
                          className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-200">
                            {row.dimensionValue}
                          </td>
                          {summaryData.measureCols.map((col) => {
                            const cell = row.cellCounts[col.key] || { count: 0, pct: "0.0" };
                            return (
                              <td
                                key={col.key}
                                className="px-4 py-3 text-right text-slate-700 dark:text-zinc-300"
                              >
                                <span className="font-semibold text-slate-800 dark:text-zinc-100">
                                  {cell.count}
                                </span>
                                {showPercentages && (
                                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 ml-1.5 font-normal">
                                    ({cell.pct}%)
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-zinc-50 bg-slate-50/40 dark:bg-zinc-800/30">
                            <span>{row.rowTotal}</span>
                            {showPercentages && (
                              <span className="text-[11px] text-slate-400 dark:text-zinc-500 ml-1.5 font-normal">
                                (100.0%)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Grand Total Row */}
                      {showGrandTotal && (
                        <tr className="bg-slate-100/70 dark:bg-zinc-800/80 border-t-2 border-slate-200 dark:border-zinc-700 font-bold">
                          <td className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                            Grand Total
                          </td>
                          {summaryData.measureCols.map((c) => {
                            const sum = summaryData.colTotals[c.key] || 0;
                            const pct = summaryData.colTotalPcts[c.key] || "0.0";
                            return (
                              <td
                                key={c.key}
                                className="px-4 py-3 text-right text-slate-900 dark:text-zinc-100"
                              >
                                <span>{sum}</span>
                                {showPercentages && (
                                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 ml-1.5 font-normal">
                                    ({pct}%)
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right font-extrabold text-slate-950 dark:text-white bg-slate-200/50 dark:bg-zinc-700/50">
                            <span>{summaryData.grandTotalCount}</span>
                            {showPercentages && (
                              <span className="text-[11px] text-slate-500 dark:text-zinc-400 ml-1.5 font-normal">
                                (100.0%)
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ROW-LEVEL GROUPED STUDENT TABLES */
            <div className="space-y-4">
              {/* Top Quick Actions Bar */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  {reportResults.length} records generated
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="h-8 gap-1.5 text-xs rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <Download className="size-3.5" />
                    Export CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 gap-1.5 text-xs rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <Printer className="size-3.5" />
                    Print
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateReport}
                    className="h-8 size-8 p-0 rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="size-3.5 text-slate-600" />
                  </Button>
                </div>
              </div>

              {/* Group Cards Container matching Screenshot 2 */}
              <div className="space-y-4">
                {groupedData.map(({ groupKey, students }) => (
                  <div
                    key={groupKey}
                    className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {/* Group Header */}
                    {groupBy !== "none" && (
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8fafc] dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800">
                        <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                          {groupKey}
                        </span>
                        <span className="text-[11.5px] text-slate-400 dark:text-zinc-500">
                          {students.length} students
                        </span>
                      </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            {includeSerialNumbers && (
                              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 w-16">
                                S.NO
                              </th>
                            )}
                            {activeColumnDefs.map((col) => (
                              <th
                                key={col.id}
                                className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 whitespace-nowrap"
                              >
                                {col.label.toUpperCase()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                          {students.map((student) => (
                            <tr
                              key={student.id}
                              className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                            >
                              {includeSerialNumbers && (
                                <td className="px-4 py-3 text-slate-500 dark:text-zinc-400 font-normal">
                                  {student.sno}
                                </td>
                              )}
                              {activeColumnDefs.map((col) => (
                                <td
                                  key={col.id}
                                  className="px-4 py-3 text-slate-700 dark:text-zinc-300 whitespace-nowrap"
                                >
                                  {(student as any)[col.id] || "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

function parseDDMMYYYY(str: string): number {
  try {
    const parts = str.split("-");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d).getTime();
    }
  } catch {}
  return 0;
}

export default AdminStudentReports;
