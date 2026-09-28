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
  sections: ModuleNavSection[];
}

const iconCls = "size-5 shrink-0";

function direct(key: string, label: string, icon: React.ReactNode, permModule?: string | null): ModuleNavItem {
  return { key, label, icon, permModule, sections: [{ items: [{ key, label, icon, permModule }] }] };
}

export const moduleNavItems: Partial<Record<UserRole, ModuleNavItem[]>> = {

  teacher: [
    direct("dashboard", "Dashboard", <LayoutDashboard className={iconCls} />),
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
    direct("dashboard", "Dashboard", <LayoutDashboard className={iconCls} />),
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
    direct("dashboard", "Dashboard", <LayoutDashboard className={iconCls} />),
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
    direct("dashboard", "Dashboard", <LayoutDashboard className={iconCls} />),
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

export function findModuleForScreen(
  items: ModuleNavItem[],
  screen: string
): ModuleNavItem | undefined {
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
        { key: "security-pin", label: "Security", icon: <Fingerprint className={iconCls} />, badge: "NEW", disabled: true },
      ],
    },
    {
      label: "Utilities",
      items: [
        { key: "permissions-catalog", label: "Permissions Catalog", icon: <ListChecks className={iconCls} /> },
        { key: "seed-defaults", label: "Seed Defaults", icon: <Wand2 className={iconCls} />, disabled: true },
      ],
    },
  ],
  academics: [
    {
      label: "Overview",
      items: [
        { key: "academics-dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconCls} />, disabled: true },
      ],
    },
    {
      label: "Structure",
      items: [
        { key: "academic-years", label: "Sessions", icon: <CalendarDays className={iconCls} /> },
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
        { key: "calendar", label: "Calendar", icon: <Calendar className={iconCls} /> },
      ],
    },
    {
      label: "Admin",
      items: [
        { key: "school-settings", label: "Settings", icon: <Settings className={iconCls} />, permModule: "settings" },
      ],
    },
  ],
  students: [
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
        { key: "certificates", label: "Certificates", icon: <Award className={iconCls} />, permModule: "students" },
      ],
    },
  ],
  employees: [
    {
      label: "Overview",
      items: [
        { key: "teachers", label: "Teachers", icon: <Users className={iconCls} /> },
        { key: "staff", label: "Staff", icon: <UserPlus className={iconCls} /> },
        { key: "parents", label: "Parents", icon: <Heart className={iconCls} /> },
      ],
    },
  ],
  "student-attendance": [
    {
      label: "Overview",
      items: [
        { key: "attendance", label: "Mark Attendance", icon: <CalendarCheck className={iconCls} /> },
      ],
    },
  ],
  "employee-attendance": [
    {
      label: "Overview",
      items: [
        { key: "teacher-attendance", label: "Teacher Attendance", icon: <GraduationCap className={iconCls} /> },
        { key: "staff-attendance", label: "Staff Attendance", icon: <Briefcase className={iconCls} /> },
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
  "student-fees": [
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
  "money-book": [
    {
      label: "Overview",
      items: [{ key: "expenses", label: "Money Book", icon: <Wallet className={iconCls} /> }],
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
  direct("dashboard", "Dashboard", <LayoutDashboard className={iconCls} />),
];

function moduleFromCard(card: ModuleCard): ModuleNavItem {
  const Icon = card.icon;
  const icon = <Icon className={iconCls} />;
  const screen = card.screen as string;
  return {
    key: card.id,
    label: card.title,
    icon,
    permModule: card.permModule ?? null,
    defaultScreen: screen,
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
