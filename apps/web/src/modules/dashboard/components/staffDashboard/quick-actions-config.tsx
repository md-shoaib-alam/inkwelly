import React from "react";
import {
  Bell,
  Calendar,
  Clock,
  School,
  Wallet,
  UserCheck,
  GraduationCap,
  Users,
  Layers,
  Tag,
  Percent,
  Banknote,
  FileCheck,
  UserSearch,
  History,
  Bus,
  Briefcase,
  ClipboardList,
  FileText,
  Trophy,
  IdCard,
  Award,
  ArrowRight,
  Zap,
  BarChart3,
  TicketCheck,
  CalendarDays,
  BookOpen,
} from "lucide-react";

export interface QuickActionItem {
  label: string;
  icon: React.ReactNode;
  screen: string;
  permModule: string | null;
  color: string;
  category: string;
}

export const allQuickActions: QuickActionItem[] = [
  // --- People Management ---
  {
    label: "Students",
    icon: <GraduationCap className="size-5" />,
    screen: "students",
    permModule: "students",
    color: "bg-indigo-500 hover:bg-indigo-600",
    category: "People Management",
  },
  {
    label: "Teachers",
    icon: <Users className="size-5" />,
    screen: "teachers",
    permModule: "teachers",
    color: "bg-blue-500 hover:bg-blue-600",
    category: "People Management",
  },

  // --- Academic Management ---
  {
    label: "Academic Years",
    icon: <CalendarDays className="size-5" />,
    screen: "academic-years",
    permModule: "settings",
    color: "bg-amber-500 hover:bg-amber-600",
    category: "Academic Management",
  },
  {
    label: "Classes",
    icon: <School className="size-5" />,
    screen: "classes",
    permModule: "classes",
    color: "bg-violet-500 hover:bg-violet-600",
    category: "Academic Management",
  },
  {
    label: "Subjects",
    icon: <BookOpen className="size-5" />,
    screen: "subjects",
    permModule: "subjects",
    color: "bg-indigo-600 hover:bg-indigo-700",
    category: "Academic Management",
  },
  {
    label: "Timetable",
    icon: <Clock className="size-5" />,
    screen: "timetable",
    permModule: "timetable",
    color: "bg-emerald-500 hover:bg-emerald-600",
    category: "Academic Management",
  },
  {
    label: "Calendar",
    icon: <Calendar className="size-5" />,
    screen: "calendar",
    permModule: "calendar",
    color: "bg-rose-500 hover:bg-rose-600",
    category: "Academic Management",
  },

  // --- Attendance Group ---
  {
    label: "My Attendance",
    icon: <UserCheck className="size-5" />,
    screen: "my-attendance",
    permModule: null,
    color: "bg-emerald-600 hover:bg-emerald-700",
    category: "Operations",
  },
  {
    label: "Student Attendance",
    icon: <Users className="size-5" />,
    screen: "attendance",
    permModule: "attendance",
    color: "bg-sky-500 hover:bg-sky-600",
    category: "Operations",
  },
  {
    label: "Teacher Attendance",
    icon: <GraduationCap className="size-5" />,
    screen: "teacher-attendance",
    permModule: "attendance",
    color: "bg-blue-500 hover:bg-blue-600",
    category: "Operations",
  },
  {
    label: "Staff Attendance",
    icon: <Briefcase className="size-5" />,
    screen: "staff-attendance",
    permModule: "attendance",
    color: "bg-slate-500 hover:bg-slate-600",
    category: "Operations",
  },

  // --- Exam Management ---
  {
    label: "Exams",
    icon: <ClipboardList className="size-5" />,
    screen: "exams",
    permModule: "exams",
    color: "bg-purple-500 hover:bg-purple-600",
    category: "Operations",
  },
  {
    label: "Results Entry",
    icon: <FileText className="size-5" />,
    screen: "results-entry",
    permModule: "exams",
    color: "bg-indigo-500 hover:bg-indigo-600",
    category: "Operations",
  },
  {
    label: "Published Results",
    icon: <Trophy className="size-5" />,
    screen: "published-results",
    permModule: "exams",
    color: "bg-amber-500 hover:bg-amber-600",
    category: "Operations",
  },
  {
    label: "Admit Cards",
    icon: <IdCard className="size-5" />,
    screen: "admit-cards",
    permModule: "exams",
    color: "bg-sky-600 hover:bg-sky-700",
    category: "Operations",
  },
  {
    label: "Print Marksheet",
    icon: <Award className="size-5" />,
    screen: "print-marksheet",
    permModule: "exams",
    color: "bg-violet-600 hover:bg-violet-700",
    category: "Operations",
  },

  // --- Promotions Group ---
  {
    label: "Promotions",
    icon: <ArrowRight className="size-5" />,
    screen: "promotions",
    permModule: "students",
    color: "bg-emerald-500 hover:bg-emerald-600",
    category: "Operations",
  },
  {
    label: "Bulk Promote",
    icon: <Zap className="size-5" />,
    screen: "bulk-promote",
    permModule: "students",
    color: "bg-yellow-500 hover:bg-yellow-600",
    category: "Operations",
  },
  {
    label: "Graduated",
    icon: <GraduationCap className="size-5" />,
    screen: "graduated",
    permModule: "students",
    color: "bg-teal-500 hover:bg-teal-600",
    category: "Operations",
  },

  // --- Leave Management ---
  {
    label: "Student Leaves",
    icon: <GraduationCap className="size-5" />,
    screen: "student-leaves",
    permModule: "attendance",
    color: "bg-violet-500 hover:bg-violet-600",
    category: "Operations",
  },
  {
    label: "Teacher Leaves",
    icon: <Briefcase className="size-5" />,
    screen: "teacher-leaves",
    permModule: "attendance",
    color: "bg-blue-500 hover:bg-blue-600",
    category: "Operations",
  },
  {
    label: "Staff Leaves",
    icon: <Users className="size-5" />,
    screen: "staff-leaves",
    permModule: "attendance",
    color: "bg-slate-500 hover:bg-slate-600",
    category: "Operations",
  },

  // --- Certificates ---
  {
    label: "Certificates",
    icon: <Award className="size-5" />,
    screen: "certificates",
    permModule: "students",
    color: "bg-teal-600 hover:bg-teal-700",
    category: "Operations",
  },

  // --- Fees Group ---
  {
    label: "Set Fees",
    icon: <Layers className="size-5" />,
    screen: "fees",
    permModule: "fees",
    color: "bg-emerald-500 hover:bg-emerald-600",
    category: "Finance",
  },
  {
    label: "Fee Categories",
    icon: <Tag className="size-5" />,
    screen: "fee-categories",
    permModule: "fees",
    color: "bg-teal-500 hover:bg-teal-600",
    category: "Finance",
  },
  {
    label: "Add Concession",
    icon: <Percent className="size-5" />,
    screen: "fee-concessions",
    permModule: "fees",
    color: "bg-green-500 hover:bg-green-600",
    category: "Finance",
  },
  {
    label: "Make Payment",
    icon: <Banknote className="size-5" />,
    screen: "make-payment",
    permModule: "fees",
    color: "bg-emerald-600 hover:bg-emerald-700",
    category: "Finance",
  },
  {
    label: "Check Receipt",
    icon: <FileCheck className="size-5" />,
    screen: "check-receipt",
    permModule: "fees",
    color: "bg-teal-600 hover:bg-teal-700",
    category: "Finance",
  },
  {
    label: "Fee Status",
    icon: <UserSearch className="size-5" />,
    screen: "fee-status",
    permModule: "fees",
    color: "bg-emerald-500 hover:bg-emerald-600",
    category: "Finance",
  },
  {
    label: "Check Payments",
    icon: <History className="size-5" />,
    screen: "check-payments",
    permModule: "fees",
    color: "bg-zinc-600 hover:bg-zinc-700",
    category: "Finance",
  },
  {
    label: "Transport Fee",
    icon: <Bus className="size-5" />,
    screen: "transport-fee",
    permModule: "fees",
    color: "bg-amber-600 hover:bg-amber-700",
    category: "Finance",
  },

  // --- School Expenses ---
  {
    label: "School Expenses",
    icon: <Wallet className="size-5" />,
    screen: "expenses",
    permModule: null,
    color: "bg-rose-500 hover:bg-rose-600",
    category: "Finance",
  },

  // --- Notices, Support & Reports ---
  {
    label: "Notices",
    icon: <Bell className="size-5" />,
    screen: "notices",
    permModule: "notices",
    color: "bg-amber-500 hover:bg-amber-600",
    category: "Communication & Support",
  },
  {
    label: "Support Tickets",
    icon: <TicketCheck className="size-5" />,
    screen: "tickets",
    permModule: null,
    color: "bg-cyan-500 hover:bg-cyan-600",
    category: "Communication & Support",
  },
  {
    label: "Reports",
    icon: <BarChart3 className="size-5" />,
    screen: "reports",
    permModule: "reports",
    color: "bg-indigo-500 hover:bg-indigo-600",
    category: "Communication & Support",
  },
];
