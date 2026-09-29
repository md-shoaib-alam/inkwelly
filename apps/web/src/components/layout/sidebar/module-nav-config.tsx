import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Briefcase,
  CalendarCheck,
  IdCard,
  ClipboardList,
  CalendarDays,
  IndianRupee,
  Wallet,
  Bell,
  Shield,
  School,
  BookOpen,
  TrendingUp,
  FileText,
  Clock,
  TicketCheck,
  CreditCard,
  Crown,
  Heart,
  Layers,
  Tag,
  Percent,
  Banknote,
  FileCheck,
  UserSearch,
  History,
  Bus,
  Award,
  Zap,
  ArrowRight,
  Trophy,
  UserCheck,
  Calendar,
  BarChart3,
  UserPlus,
  Code2,
  Fingerprint,
  ListChecks,
  Wand2,
  BookMarked,
  LayoutGrid,
  Map,
  Settings,
  ArrowLeftRight,
  MessageSquare,
  MoveRight,
  Trash2,
  Upload,
  SlidersHorizontal,
  Plus,
  Lock,
  KeyRound,
  Wrench,
  SquarePen,
  RotateCcw,
} from "lucide-react";
import type { AppUser, UserRole } from "@/store/use-app-store";
import { hasPermission } from "@/lib/permissions";
import { moduleCatalogue, type ModuleCard } from "@/modules/dashboard/components/adminDashboard/moduleCatalogue";

// Dual-sidebar navigation model:
// - ModuleNavItem = one entry in the dark primary rail (global module)
// - sections/items = the white secondary panel (module-specific nav)
export interface ModuleNavEntry {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  permModule?: string | null;
  /** A link that exists in the shipped IA but has no screen here yet. Rendered, never navigable. */
  disabled?: boolean;
}

export interface ModuleNavSection {
  label?: string;
  items: ModuleNavEntry[];
}

export interface ModuleNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  permModule?: string | null;
  rootOnly?: boolean;
  /** Where the rail sends you when this module is selected. Falls back to the first sub-link. */
  defaultScreen?: string;
  /**
   * The bare root keeps serving its own screen key to the roles that have that key in
   * their nav tree; only an admin's root becomes the landing. From ModuleCard.
   */
  rootServesOwnScreen?: boolean;
  /** Spelled-out name for the panel header, when `label` is abbreviated for the rail. */
  panelTitle?: string;
  sections: ModuleNavSection[];
}

const iconCls = "size-5 shrink-0";

function direct(key: string, label: string, icon: React.ReactNode, permModule?: string | null): ModuleNavItem {
  return { key, label, icon, permModule, sections: [{ items: [{ key, label, icon, permModule }] }] };
}

export const moduleNavItems: Partial<Record<UserRole, ModuleNavItem[]>> = {

  teacher: [
    direct("modules", "Dashboard", <LayoutDashboard className={iconCls} />),
    direct("my-classes", "My Classes", <School className={iconCls} />),
    direct("my-subjects", "My Subjects", <BookOpen className={iconCls} />),
    {
      key: "attendance",
      label: "Attendance",
      icon: <CalendarCheck className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [
            { key: "my-attendance", label: "My Attendance", icon: <UserCheck className={iconCls} /> },
            { key: "take-attendance", label: "Student Attendance", icon: <Users className={iconCls} /> },
          ],
        },
      ],
    },
    {
      key: "grades",
      label: "Grades",
      icon: <TrendingUp className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [
            { key: "assessments", label: "Assessments", icon: <ClipboardList className={iconCls} /> },
            { key: "school-exams", label: "School Exams", icon: <BookOpen className={iconCls} /> },
          ],
        },
      ],
    },
    {
      key: "homework",
      label: "Homework",
      icon: <FileText className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [
            { key: "homework", label: "Active Homework", icon: <FileText className={iconCls} /> },
            { key: "old-homework", label: "Old Homework", icon: <History className={iconCls} /> },
          ],
        },
      ],
    },
    direct("leaves", "My Leaves", <CalendarDays className={iconCls} />),
    direct("timetable", "Timetable", <Clock className={iconCls} />),
    direct("notices", "Notices", <Bell className={iconCls} />),
    direct("calendar", "Calendar", <Calendar className={iconCls} />),
    direct("tickets", "Support", <TicketCheck className={iconCls} />),
  ],

  student: [
    direct("modules", "Dashboard", <LayoutDashboard className={iconCls} />),
    direct("my-classes", "My Classes", <School className={iconCls} />),
    {
      key: "grades",
      label: "Grades",
      icon: <TrendingUp className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [{ key: "school-exams", label: "School Exams", icon: <BookOpen className={iconCls} /> }],
        },
      ],
    },
    direct("assessments", "Assessments", <ClipboardList className={iconCls} />),
    direct("my-attendance", "Attendance", <UserCheck className={iconCls} />),
    direct("homework", "Homework", <FileText className={iconCls} />),
    direct("leaves", "My Leaves", <CalendarDays className={iconCls} />),
    direct("timetable", "Timetable", <Clock className={iconCls} />),
    direct("fees", "Fees", <CreditCard className={iconCls} />),
    direct("notices", "Notices", <Bell className={iconCls} />),
    direct("calendar", "Calendar", <Calendar className={iconCls} />),
    direct("tickets", "Support", <TicketCheck className={iconCls} />),
  ],

  parent: [
    direct("modules", "Dashboard", <LayoutDashboard className={iconCls} />),
    direct("children", "My Children", <Users className={iconCls} />),
    direct("homework", "Homework", <FileText className={iconCls} />),
    {
      key: "grades",
      label: "Grades",
      icon: <TrendingUp className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [
            { key: "school-exams", label: "School Exams", icon: <BookOpen className={iconCls} /> },
            { key: "assessments", label: "Assessments", icon: <ClipboardList className={iconCls} /> },
          ],
        },
      ],
    },
    direct("attendance", "Attendance", <UserCheck className={iconCls} />),
    direct("fees", "Fees", <CreditCard className={iconCls} />),
    direct("notices", "Notices", <Bell className={iconCls} />),
    direct("timetable", "Timetable", <Clock className={iconCls} />),
    direct("subscription", "Subscription", <Crown className={iconCls} />),
    direct("calendar", "Calendar", <Calendar className={iconCls} />),
    direct("tickets", "Support", <TicketCheck className={iconCls} />),
  ],

  staff: [
    direct("modules", "Dashboard", <LayoutDashboard className={iconCls} />),
    {
      key: "academics",
      label: "Academics",
      icon: <GraduationCap className={iconCls} />,
      sections: [
        {
          label: "Structure",
          items: [
            { key: "academic-years", label: "Academic Years", icon: <CalendarDays className={iconCls} />, permModule: "academic-years" },
            { key: "classes", label: "Classes", icon: <School className={iconCls} />, permModule: "classes" },
            { key: "subjects", label: "Subjects", icon: <BookOpen className={iconCls} />, permModule: "subjects" },
          ],
        },
        {
          label: "Timetable",
          items: [
            { key: "timetable", label: "Timetable", icon: <Clock className={iconCls} />, permModule: "timetable" },
            { key: "calendar", label: "Calendar", icon: <Calendar className={iconCls} />, permModule: "calendar" },
          ],
        },
      ],
    },
    {
      key: "students",
      label: "Students",
      icon: <Users className={iconCls} />,
      permModule: "students",
      sections: [
        {
          label: "Overview",
          items: [{ key: "students", label: "All Students", icon: <Users className={iconCls} /> }],
        },
        {
          label: "Operations",
          items: [
            { key: "promotions", label: "Promotions", icon: <ArrowRight className={iconCls} /> },
            { key: "bulk-promote", label: "Bulk Promote", icon: <Zap className={iconCls} /> },
            { key: "graduated", label: "Graduated", icon: <GraduationCap className={iconCls} /> },
            { key: "certificates", label: "Certificates", icon: <Award className={iconCls} />, permModule: "certificates" },
          ],
        },
      ],
    },
    {
      key: "employees",
      label: "Employees",
      icon: <Briefcase className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [{ key: "teachers", label: "Teachers", icon: <Users className={iconCls} />, permModule: "teachers" }],
        },
      ],
    },
    {
      key: "attendance",
      label: "Students Attendance",
      icon: <CalendarCheck className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [
            { key: "my-attendance", label: "My Attendance", icon: <UserCheck className={iconCls} />, permModule: null },
            { key: "attendance", label: "Student Attendance", icon: <Users className={iconCls} />, permModule: "attendance" },
          ],
        },
      ],
    },
    {
      key: "employee-attendance",
      label: "Employee Attendance",
      icon: <IdCard className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [
            { key: "teacher-attendance", label: "Teacher Attendance", icon: <GraduationCap className={iconCls} />, permModule: "attendance" },
            { key: "staff-attendance", label: "Staff Attendance", icon: <Briefcase className={iconCls} />, permModule: "attendance" },
          ],
        },
      ],
    },
    {
      key: "exams",
      label: "Exams",
      icon: <ClipboardList className={iconCls} />,
      permModule: "exams",
      sections: [
        {
          label: "Overview",
          items: [{ key: "exams", label: "Exams", icon: <ClipboardList className={iconCls} /> }],
        },
        {
          label: "Operations",
          items: [
            { key: "results-entry", label: "Results Entry", icon: <FileText className={iconCls} /> },
            { key: "admit-cards", label: "Admit Cards", icon: <IdCard className={iconCls} /> },
            { key: "print-marksheet", label: "Print Marksheet", icon: <Award className={iconCls} /> },
          ],
        },
        {
          label: "Data",
          items: [{ key: "published-results", label: "Published Results", icon: <Trophy className={iconCls} /> }],
        },
      ],
    },
    {
      key: "leaves",
      label: "Leaves",
      icon: <CalendarDays className={iconCls} />,
      permModule: "leaves",
      sections: [
        {
          label: "Operations",
          items: [
            { key: "student-leaves", label: "Student Leaves", icon: <GraduationCap className={iconCls} /> },
            { key: "teacher-leaves", label: "Teacher Leaves", icon: <Briefcase className={iconCls} /> },
            { key: "staff-leaves", label: "Staff Leaves", icon: <Users className={iconCls} /> },
          ],
        },
      ],
    },
    {
      key: "student-fees",
      label: "Student Fees",
      icon: <IndianRupee className={iconCls} />,
      permModule: "fees",
      sections: [
        {
          label: "Operations",
          items: [
            { key: "fees", label: "Set Fees", icon: <Layers className={iconCls} /> },
            { key: "fee-categories", label: "Fee Categories", icon: <Tag className={iconCls} /> },
            { key: "fee-concessions", label: "Add Concession", icon: <Percent className={iconCls} /> },
            { key: "transport-fee", label: "Transport Fee", icon: <Bus className={iconCls} /> },
          ],
        },
        {
          label: "Actions",
          items: [
            { key: "make-payment", label: "Make Payment", icon: <Banknote className={iconCls} /> },
            { key: "check-receipt", label: "Check Receipt", icon: <FileCheck className={iconCls} /> },
          ],
        },
        {
          label: "Data",
          items: [
            { key: "fee-status", label: "Fee Status", icon: <UserSearch className={iconCls} /> },
            { key: "check-payments", label: "Check Payments", icon: <History className={iconCls} /> },
          ],
        },
      ],
    },
    direct("expenses", "Money Book", <Wallet className={iconCls} />, "expenses"),
    {
      key: "communication",
      label: "Communication",
      icon: <Bell className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [
            { key: "notices", label: "Notices", icon: <Bell className={iconCls} />, permModule: "notices" },
            { key: "tickets", label: "Support Tickets", icon: <TicketCheck className={iconCls} />, permModule: "tickets" },
          ],
        },
      ],
    },
    {
      key: "administration",
      label: "Administration",
      icon: <Shield className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [{ key: "reports", label: "Reports & Exports", icon: <BarChart3 className={iconCls} />, permModule: "reports" }],
        },
      ],
    },
  ],
};

/**
 * The rail item a resolved screen belongs to. `screen` is what the URL says, so it
 * can be qualified (`academics/timetable`) or bare (`modules`, and every
 * non-admin role's rows): the module half of a qualified key is the answer, and the
 * row search is only for the bare case.
 */
export function findModuleForScreen(
  items: ModuleNavItem[],
  screen: string
): ModuleNavItem | undefined {
  const slash = screen.indexOf("/");
  if (slash !== -1) {
    return items.find((m) => m.key === screen.slice(0, slash));
  }
  // A module root (`/slug/academics`) names the rail row rather than a panel row, so
  // the row search below would find nothing and the rail would fall back to Dashboard.
  // Measured against all 44 live row keys: the id check changes no answer.
  const byId = items.find((m) => m.key === screen);
  if (byId) return byId;
  return items.find((m) =>
    m.sections.some((s) => s.items.some((i) => i.key === screen))
  );
}

export function getDefaultScreen(item: ModuleNavItem): string {
  const firstLive = item.sections.flatMap((s) => s.items).find((i) => !i.disabled);
  return item.defaultScreen ?? firstLive?.key ?? item.key;
}

/* --------------------------------------------------------------------------
 * Admin rail + contextual panels.
 *
 * The module list itself deliberately lives in moduleCatalogue.ts, not here, so
 * the dark rail and the dashboard grid can never disagree on a name, an icon or
 * the order. What this file owns is only the per-module sub-links, keyed by the
 * same ids the grid uses.
 * -------------------------------------------------------------------------- */

export const adminPanelSections: Record<string, ModuleNavSection[]> = {
  iam: [
    {
      label: "Overview",
      items: [
        { key: "iam-dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconCls} /> },
      ],
    },
    {
      label: "Access Control",
      items: [
        { key: "roles", label: "Roles", icon: <Shield className={iconCls} /> },
        { key: "role-assignments", label: "Assignments", icon: <Users className={iconCls} /> },
        { key: "security-pin", label: "Security", icon: <Fingerprint className={iconCls} />, badge: "NEW" },
      ],
    },
    {
      label: "Utilities",
      items: [
        { key: "permissions-catalog", label: "Permissions Catalog", icon: <ListChecks className={iconCls} /> },
        { key: "seed-defaults", label: "Seed Defaults", icon: <Wand2 className={iconCls} /> },
      ],
    },
  ],
  academics: [
    {
      label: "Overview",
      items: [
        { key: "academics-dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconCls} /> },
      ],
    },
    {
      label: "Structure",
      items: [
        // The URL reads `/academics/session`. The screen key is `session` for admins;
        // `academic-years` stays as the legacy alias in the dispatcher and as the staff
        // accordion's own key below, so old bookmarks and staff links keep landing.
        { key: "session", label: "Sessions", icon: <CalendarDays className={iconCls} /> },
        { key: "classes", label: "Classes", icon: <School className={iconCls} /> },
      ],
    },
    {
      label: "Subjects",
      items: [
        { key: "subjects", label: "Subjects", icon: <BookOpen className={iconCls} /> },
        { key: "board-codes", label: "Board Codes", icon: <Code2 className={iconCls} />, disabled: true },
        { key: "offerings", label: "Offerings", icon: <BookMarked className={iconCls} />, disabled: true },
        { key: "groups", label: "Groups", icon: <Layers className={iconCls} />, disabled: true },
        { key: "teaching-batches", label: "Teaching Batches", icon: <Users className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Timetable",
      items: [
        { key: "timetable", label: "Timetables", icon: <Clock className={iconCls} /> },
        { key: "timetable-templates", label: "Templates", icon: <LayoutGrid className={iconCls} />, disabled: true },
        { key: "timetable-by-class", label: "By Class", icon: <Map className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Admin",
      items: [
        { key: "school-settings", label: "Settings", icon: <Settings className={iconCls} />, permModule: "settings" },
      ],
    },
  ],
  events: [
    {
      label: "Overview",
      items: [
        { key: "events-dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconCls} />, disabled: true },
        { key: "calendar", label: "Calendar", icon: <Calendar className={iconCls} /> },
        { key: "all-events", label: "All Events", icon: <CalendarCheck className={iconCls} />, disabled: true },
        { key: "upcoming", label: "Upcoming", icon: <Clock className={iconCls} />, disabled: true },
        { key: "day-programs", label: "Day Programs", icon: <CalendarDays className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Operations",
      items: [
        { key: "create-event", label: "Create Event", icon: <Plus className={iconCls} />, disabled: true },
        { key: "bulk-add", label: "Bulk Add", icon: <Wand2 className={iconCls} />, disabled: true },
      ],
    },
  ],
  students: [
    {
      label: "Overview",
      items: [
        { key: "students-dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconCls} /> },
        { key: "list", label: "All Students", icon: <Users className={iconCls} /> },
        { key: "classes", label: "Classes", icon: <School className={iconCls} />, permModule: "classes" },
      ],
    },
    {
      label: "Operations",
      items: [
        { key: "admissions", label: "Admissions", icon: <UserPlus className={iconCls} />, permModule: "students" },
        { key: "student-documents", label: "Documents", icon: <FileText className={iconCls} />, disabled: true },
        { key: "bulk-update", label: "Bulk Update", icon: <Layers className={iconCls} />, permModule: "students" },
        { key: "class-change", label: "Class Change", icon: <RotateCcw className={iconCls} />, permModule: "students" },
        { key: "promotions", label: "Promotion", icon: <TrendingUp className={iconCls} />, permModule: "promotions" },
        { key: "transfers", label: "Transfer", icon: <ArrowLeftRight className={iconCls} />, disabled: true },
        { key: "student-requests", label: "Requests", icon: <MessageSquare className={iconCls} />, disabled: true },
        { key: "bulk-promote", label: "Bulk Promote", icon: <Zap className={iconCls} /> },
        { key: "graduated", label: "Graduated", icon: <GraduationCap className={iconCls} /> },
        { key: "certificates", label: "Certificates", icon: <Award className={iconCls} />, permModule: "students" },
      ],
    },
    {
      label: "Data",
      items: [
        { key: "reports", label: "Reports", icon: <BarChart3 className={iconCls} />, permModule: "reports" },
      ],
    },
    {
      label: "Admin",
      items: [
        { key: "student-settings", label: "Settings", icon: <Settings className={iconCls} />, disabled: true },
        { key: "student-trash", label: "Trash", icon: <Trash2 className={iconCls} /> },
      ],
    },
  ],
  employees: [
    {
      label: "Overview",
      items: [
        { key: "employees-dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconCls} />, disabled: true },
        { key: "staff", label: "All Employees", icon: <Users className={iconCls} /> },
        { key: "teachers", label: "Teachers", icon: <UserCheck className={iconCls} />, permModule: "teachers" },
        { key: "parents", label: "Parents", icon: <Heart className={iconCls} />, permModule: "parents" },
      ],
    },
    {
      label: "Operations",
      items: [
        { key: "enrollment", label: "Enrollment", icon: <UserPlus className={iconCls} />, disabled: true },
        { key: "employee-change-requests", label: "Change Requests", icon: <ListChecks className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Data",
      items: [
        { key: "employee-import", label: "Import", icon: <Upload className={iconCls} />, disabled: true },
        { key: "reports", label: "Reports", icon: <BarChart3 className={iconCls} />, permModule: "reports" },
      ],
    },
    {
      label: "Admin",
      items: [
        { key: "employee-settings", label: "Settings", icon: <Settings className={iconCls} />, disabled: true },
        { key: "employee-trash", label: "Trash", icon: <Trash2 className={iconCls} />, disabled: true },
      ],
    },
  ],
  "student-attendance": [
    {
      label: "Overview",
      items: [
        { key: "attendance-dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconCls} />, disabled: true },
        { key: "attendance", label: "Class Register", icon: <BookOpen className={iconCls} /> },
      ],
    },
    {
      label: "Marking",
      items: [
        { key: "attendance-today", label: "Today", icon: <CalendarDays className={iconCls} />, disabled: true },
        { key: "attendance-past-days", label: "Past Days", icon: <History className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Inbox",
      items: [
        { key: "student-leaves", label: "Leave Applications", icon: <FileText className={iconCls} /> },
      ],
    },
    {
      label: "Data",
      items: [
        { key: "reports", label: "Reports", icon: <BarChart3 className={iconCls} />, permModule: "reports" },
        { key: "attendance-import", label: "Import", icon: <Upload className={iconCls} />, disabled: true },
      ],
    },
  ],
  "employee-attendance": [
    {
      label: "Overview",
      items: [
        { key: "employee-attendance-dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconCls} />, disabled: true },
        { key: "employee-attendance-register", label: "Register", icon: <ListChecks className={iconCls} />, disabled: true },
        { key: "staff", label: "Employees", icon: <Users className={iconCls} />, permModule: "staff" },
      ],
    },
    {
      label: "Marking",
      items: [
        { key: "staff-attendance", label: "Daily Attendance", icon: <CalendarCheck className={iconCls} /> },
        { key: "teacher-attendance", label: "Teacher Attendance", icon: <GraduationCap className={iconCls} /> },
      ],
    },
    {
      label: "Inbox",
      items: [
        { key: "staff-leaves", label: "Leave Applications", icon: <FileText className={iconCls} /> },
        { key: "self-requests", label: "Self Requests", icon: <MessageSquare className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Reports",
      items: [
        { key: "reports", label: "Reports", icon: <BarChart3 className={iconCls} />, permModule: "reports" },
        { key: "employee-attendance-import", label: "Import", icon: <Upload className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Setup",
      items: [
        { key: "attendance-assignments", label: "Assignments", icon: <ClipboardList className={iconCls} />, disabled: true },
        { key: "attendance-adjustments", label: "Adjustments", icon: <SlidersHorizontal className={iconCls} />, disabled: true },
        { key: "employee-attendance-settings", label: "Settings", icon: <Settings className={iconCls} />, disabled: true },
      ],
    },
  ],
  "student-fees": [
    {
      label: "Overview",
      items: [
        { key: "fees", label: "Dashboard", icon: <LayoutDashboard className={iconCls} /> },
        { key: "fee-categories", label: "Fee Profiles", icon: <Tag className={iconCls} /> },
        { key: "classes", label: "Classes", icon: <School className={iconCls} />, permModule: "classes" },
      ],
    },
    {
      label: "Collection",
      items: [
        { key: "invoices", label: "Invoices", icon: <FileText className={iconCls} />, disabled: true },
        { key: "late-fees", label: "Late fees", icon: <Clock className={iconCls} />, disabled: true },
        { key: "check-payments", label: "Payments", icon: <History className={iconCls} /> },
        { key: "make-payment", label: "Collect Payment", icon: <Banknote className={iconCls} /> },
        { key: "check-receipt", label: "Receipts", icon: <FileCheck className={iconCls} /> },
        { key: "fee-status", label: "Fee Status", icon: <UserSearch className={iconCls} /> },
        { key: "fee-concessions", label: "Concessions", icon: <Percent className={iconCls} /> },
        { key: "transport-fee", label: "Transport Fee", icon: <Bus className={iconCls} /> },
        { key: "cheques", label: "Cheques", icon: <TicketCheck className={iconCls} />, disabled: true },
        { key: "reminders", label: "Reminders", icon: <Bell className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Refunds",
      items: [
        { key: "refunds", label: "Refunds", icon: <CreditCard className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Programs",
      items: [
        { key: "scholarships", label: "Scholarships", icon: <Award className={iconCls} />, disabled: true },
        { key: "rte", label: "RTE", icon: <BookMarked className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Reports",
      items: [
        { key: "reports", label: "Reports", icon: <BarChart3 className={iconCls} />, permModule: "reports" },
      ],
    },
    {
      label: "Setup",
      items: [
        { key: "fee-configuration", label: "Configuration", icon: <Settings className={iconCls} />, disabled: true },
      ],
    },
  ],
  examinations: [
    {
      label: "Overview",
      items: [{ key: "exams", label: "Exams", icon: <ClipboardList className={iconCls} /> }],
    },
    {
      label: "Operations",
      items: [
        { key: "results-entry", label: "Results Entry", icon: <FileText className={iconCls} /> },
        { key: "admit-cards", label: "Admit Cards", icon: <IdCard className={iconCls} /> },
        { key: "print-marksheet", label: "Print Marksheet", icon: <Award className={iconCls} /> },
      ],
    },
    {
      label: "Data",
      items: [{ key: "published-results", label: "Published Results", icon: <Trophy className={iconCls} /> }],
    },
    // Tests and Homework reach teacher/student/parent roles, but the tenant dispatcher has
    // no admin case for either key, so an admin gets a "Soon" row rather than a link that
    // bounces back to the dashboard. They used to be top-level dashboard cards.
    {
      label: "Classwork",
      items: [
        { key: "assessments", label: "Tests", icon: <SquarePen className={iconCls} />, disabled: true },
        { key: "homework", label: "Homework", icon: <BookOpen className={iconCls} />, disabled: true },
      ],
    },
  ],
  leaves: [
    {
      label: "Operations",
      items: [
        { key: "student-leaves", label: "Student Leaves", icon: <GraduationCap className={iconCls} /> },
        { key: "teacher-leaves", label: "Teacher Leaves", icon: <Briefcase className={iconCls} /> },
        { key: "staff-leaves", label: "Staff Leaves", icon: <Users className={iconCls} /> },
      ],
    },
  ],
  "money-book": [
    {
      label: "Overview",
      items: [{ key: "expenses", label: "Dashboard", icon: <LayoutDashboard className={iconCls} /> }],
    },
    {
      label: "Daily work",
      items: [
        { key: "expense-entry", label: "New Entry", icon: <Plus className={iconCls} />, disabled: true },
        { key: "voucher-register", label: "Voucher Register", icon: <FileCheck className={iconCls} />, disabled: true },
        { key: "day-close", label: "Day Close", icon: <Lock className={iconCls} />, disabled: true },
        { key: "close-history", label: "Close History", icon: <History className={iconCls} />, disabled: true },
        { key: "day-book", label: "Day Book", icon: <BookOpen className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Reports",
      items: [
        { key: "money-flow", label: "Money Flow", icon: <TrendingUp className={iconCls} />, disabled: true },
        { key: "reports", label: "Reports", icon: <BarChart3 className={iconCls} />, permModule: "reports" },
      ],
    },
    {
      label: "Setup",
      items: [{ key: "money-book-setup", label: "Setup", icon: <Settings className={iconCls} />, disabled: true }],
    },
  ],
  transport: [
    {
      label: "Overview",
      items: [
        { key: "transport-dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Fleet",
      items: [
        { key: "vehicles", label: "Vehicles", icon: <Bus className={iconCls} />, disabled: true },
        { key: "routes", label: "Routes", icon: <Map className={iconCls} />, disabled: true },
        { key: "drivers", label: "Drivers", icon: <UserCheck className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Assignments",
      items: [
        { key: "transport-students", label: "Students", icon: <GraduationCap className={iconCls} />, disabled: true },
        { key: "transport-employees", label: "Employees", icon: <Briefcase className={iconCls} />, disabled: true },
        { key: "change-requests", label: "Change Requests", icon: <ListChecks className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Operations",
      items: [
        { key: "trips", label: "Trips", icon: <Clock className={iconCls} />, disabled: true },
        { key: "transport-attendance", label: "Attendance", icon: <CalendarCheck className={iconCls} />, disabled: true },
        { key: "transport-alerts", label: "Alerts", icon: <Bell className={iconCls} />, disabled: true },
        { key: "complaints", label: "Complaints", icon: <TicketCheck className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Finance",
      items: [
        { key: "transport-invoices", label: "Invoices", icon: <FileText className={iconCls} />, disabled: true },
        { key: "transport-payments", label: "Payments", icon: <Banknote className={iconCls} />, disabled: true },
        { key: "transport-receipts", label: "Receipts", icon: <FileCheck className={iconCls} />, disabled: true },
        { key: "transport-concessions", label: "Concessions", icon: <Percent className={iconCls} />, disabled: true },
        { key: "fines", label: "Fines", icon: <TrendingUp className={iconCls} />, disabled: true },
        { key: "transport-refunds", label: "Refunds", icon: <CreditCard className={iconCls} />, disabled: true },
        { key: "fee-structures", label: "Fee Structures", icon: <Layers className={iconCls} />, disabled: true },
        { key: "transport-fee", label: "Transport Fees", icon: <IndianRupee className={iconCls} /> },
      ],
    },
    {
      label: "Setup",
      items: [
        { key: "geofences", label: "Geofences", icon: <Shield className={iconCls} />, disabled: true },
        { key: "transport-configuration", label: "Configuration", icon: <Settings className={iconCls} />, disabled: true },
      ],
    },
  ],
  "ai-connect": [
    {
      label: "Overview",
      items: [
        { key: "ai-connect", label: "Dashboard", icon: <LayoutDashboard className={iconCls} /> },
      ],
    },
    {
      label: "Access control",
      items: [
        { key: "credential-issue", label: "Issue credential", icon: <Plus className={iconCls} />, disabled: true },
        { key: "credentials", label: "Credentials", icon: <KeyRound className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Activity",
      items: [
        { key: "call-history", label: "Call History", icon: <History className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Catalog",
      items: [
        { key: "tool-catalog", label: "Tool Catalog", icon: <Wrench className={iconCls} />, disabled: true },
      ],
    },
  ],
};

/**
 * True when `screen` is a declared sub-link of admin module `module`. This is what
 * tells `/demo-academy/academics/classes` (a module-scoped screen) apart from
 * `/demo-academy/students/STU-123` (a screen with a detail param) — both are three
 * segments, and nothing but this index can tell them apart.
 */
export function isAdminModuleScreen(module: string, screen: string): boolean {
  return (
    adminPanelSections[module]?.some((s) => s.items.some((i) => i.key === screen)) ?? false
  );
}

// Rail rows that aren't purchasable modules, so they aren't in the catalogue either.
const adminRailChrome: ModuleNavItem[] = [
  direct("modules", "Dashboard", <LayoutDashboard className={iconCls} />),
];

function moduleFromCard(card: ModuleCard): ModuleNavItem {
  const Icon = card.icon;
  const icon = <Icon className={iconCls} />;
  const screen = card.screen as string;
  return {
    key: card.id,
    label: card.title,
    panelTitle: card.panelTitle,
    icon,
    permModule: card.permModule ?? null,
    defaultScreen: screen,
    rootServesOwnScreen: card.rootServesOwnScreen,
    // A module with no sub-links of its own still needs one item so the panel
    // and the mobile drill-in have somewhere to land.
    sections: adminPanelSections[card.id] ?? [{ items: [{ key: screen, label: card.title, icon }] }],
  };
}

// Rail before permission filtering, so a test can assert the whole shape of it.
export function buildAdminRail(): ModuleNavItem[] {
  return [...adminRailChrome, ...moduleCatalogue.filter((c) => c.inRail).map(moduleFromCard)];
}

export function getAdminRail(user: AppUser | null): ModuleNavItem[] {
  if (!user) return [];

  const visible = (perm: string | null | undefined) => !perm || hasPermission(user, perm, "view");

  return buildAdminRail()
    .filter((m) => visible(m.permModule))
    .map((m) => ({
      ...m,
      sections: m.sections
        .map((s) => ({ ...s, items: s.items.filter((i) => visible(i.permModule ?? m.permModule)) }))
        .filter((s) => s.items.length > 0),
    }))
    .filter((m) => m.sections.length > 0);
}
