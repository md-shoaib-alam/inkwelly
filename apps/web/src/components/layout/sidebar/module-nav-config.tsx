import {
  LayoutDashboard,
  UserRound,
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
} from "lucide-react";
import type { UserRole } from "@/store/use-app-store";

// Dual-sidebar navigation model:
// - ModuleNavItem = one entry in the dark primary rail (global module)
// - sections/items = the white secondary panel (module-specific nav)
export interface ModuleNavEntry {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  permModule?: string | null;
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
  sections: ModuleNavSection[];
}

const iconCls = "size-5 shrink-0";

function direct(key: string, label: string, icon: React.ReactNode, permModule?: string | null): ModuleNavItem {
  return { key, label, icon, permModule, sections: [{ items: [{ key, label, icon, permModule }] }] };
}

export const moduleNavItems: Partial<Record<UserRole, ModuleNavItem[]>> = {
  admin: [
    direct("dashboard", "Dashboard", <LayoutDashboard className={iconCls} />),
    direct("profile", "Me", <UserRound className={iconCls} />),
    {
      key: "academics",
      label: "Academics",
      icon: <GraduationCap className={iconCls} />,
      sections: [
        {
          label: "Structure",
          items: [
            { key: "academic-years", label: "Academic Years", icon: <CalendarDays className={iconCls} /> },
            { key: "classes", label: "Classes", icon: <School className={iconCls} /> },
            { key: "subjects", label: "Subjects", icon: <BookOpen className={iconCls} /> },
          ],
        },
        {
          label: "Timetable",
          items: [
            { key: "timetable", label: "Timetable", icon: <Clock className={iconCls} /> },
            { key: "calendar", label: "Calendar", icon: <Calendar className={iconCls} /> },
          ],
        },
      ],
    },
    {
      key: "students",
      label: "Students",
      icon: <Users className={iconCls} />,
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
            { key: "certificates", label: "Certificates", icon: <Award className={iconCls} />, permModule: "students" },
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
          items: [
            { key: "teachers", label: "Teachers", icon: <Users className={iconCls} /> },
            { key: "staff", label: "Staff", icon: <UserPlus className={iconCls} /> },
            { key: "parents", label: "Parents", icon: <Heart className={iconCls} /> },
          ],
        },
      ],
    },
    direct("attendance", "Students Attendance", <CalendarCheck className={iconCls} />),
    {
      key: "employee-attendance",
      label: "Employee Attendance",
      icon: <IdCard className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [
            { key: "teacher-attendance", label: "Teacher Attendance", icon: <GraduationCap className={iconCls} /> },
            { key: "staff-attendance", label: "Staff Attendance", icon: <Briefcase className={iconCls} /> },
          ],
        },
      ],
    },
    {
      key: "exams",
      label: "Exams",
      icon: <ClipboardList className={iconCls} />,
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
    direct("expenses", "Money Book", <Wallet className={iconCls} />),
    {
      key: "communication",
      label: "Communication",
      icon: <Bell className={iconCls} />,
      sections: [
        {
          label: "Overview",
          items: [
            { key: "notices", label: "Notices", icon: <Bell className={iconCls} /> },
            { key: "tickets", label: "Support Tickets", icon: <TicketCheck className={iconCls} /> },
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
          items: [
            { key: "roles", label: "Roles & Permissions", icon: <Shield className={iconCls} /> },
            { key: "reports", label: "Reports & Exports", icon: <BarChart3 className={iconCls} /> },
          ],
        },
      ],
    },
  ],

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
  return item.sections[0]?.items[0]?.key ?? item.key;
}
