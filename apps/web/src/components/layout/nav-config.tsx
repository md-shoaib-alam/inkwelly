import {
  School,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  IndianRupee,
  Bell,
  Calendar,
  CalendarCheck,
  Clock,
  UserCheck,
  FileText,
  Trophy,
  BarChart3,
  Activity,
  Settings,
  CreditCard,
  TrendingUp,
  Building2,
  Receipt,
  UserCog,
  ScrollText,
  PieChart,
  Plug,
  Shield,
  UserPlus,
  Crown,
  Award,
  CalendarDays,
  TicketCheck,
  Heart,
  Layers,
  Tag,
  Percent,
  Banknote,
  FileCheck,
  UserSearch,
  History,
  Bus,
  IdCard,
  Briefcase,
  ArrowRight,
  Zap,
  Wallet,
  Send,
  Smartphone,
  Trash2,
  ListTodo,
} from "lucide-react";
import { type UserRole } from "@/store/use-app-store";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  permModule?: string | null;
  rootOnly?: boolean;
  children?: {
    key: string;
    label: string;
    icon: React.ReactNode;
    permModule?: string | null;
  }[];
}

export const navItems: Record<UserRole, NavItem[]> = {
  super_admin: [
    {
      key: "module",
      label: "Platform Dashboard",
      icon: <LayoutDashboard className="size-4" />,
      permModule: null,
    },
    // Core Management
    {
      key: "tenants",
      label: "School Management",
      icon: <Building2 className="size-4" />,
      permModule: "tenants",
    },
    {
      key: "deleted-tenants",
      label: "Deleted Schools",
      icon: <Trash2 className="size-4" />,
      permModule: "tenants",
    },
    {
      key: "bulk-attendance-import",
      label: "Bulk Attendance",
      icon: <ClipboardList className="size-4" />,
      permModule: "tenants",
    },
    {
      key: "users",
      label: "All Users",
      icon: <UserCog className="size-4" />,
      permModule: "users",
    },
    {
      key: "staff",
      label: "Staff / Employees",
      icon: <UserPlus className="size-4" />,
      permModule: "staff",
      rootOnly: true,
    },
    
    // Finances & Licenses
    {
      key: "billing",
      label: "Billing & Revenue",
      icon: <IndianRupee className="size-4" />,
      permModule: "billing",
    },
    {
      key: "school-subscriptions",
      label: "B2B School Subscriptions",
      icon: <Crown className="size-4" />,
      permModule: "billing",
    },
    {
      key: "subscriptions",
      label: "B2C Parent Subscriptions",
      icon: <CreditCard className="size-4" />,
      permModule: "billing",
    },

    // Platform Control
    {
      key: "feature-control",
      label: "Integrations & Roadmap",
      icon: <Plug className="size-4" />,
      permModule: "integrations",
      children: [
        {
          key: "integrations",
          label: "Integrations",
          icon: <Plug className="size-4" />,
        },
        {
          key: "roadmap",
          label: "Product Roadmap",
          icon: <ListTodo className="size-4" />,
        },
      ],
    },
    {
      key: "roles",
      label: "Roles & Permissions",
      icon: <Shield className="size-4" />,
      // No grantable module opens this: creating or handing out platform roles
      // belongs to the owner alone, matching the server's root-only guard.
      rootOnly: true,
    },
    {
      key: "manage-admins",
      label: "Manage Admins",
      icon: <UserCog className="size-4" />,
      permModule: "manage-admins",
      rootOnly: true,
    },
    {
      key: "platform-notices",
      label: "Notices",
      icon: <Bell className="size-4" />,
      permModule: "notices",
    },
    {
      key: "send-notification",
      label: "Send Push Notification",
      icon: <Send className="size-4" />,
      permModule: "notices",
    },

    // Insights & Security
    {
      key: "platform-analytics",
      label: "System Performance",
      icon: <Activity className="size-4" />,
      permModule: "analytics",
    },
    {
      key: "queue-status",
      label: "Queue Status",
      icon: <Activity className="size-4" />,
      permModule: null,
    },
    {
      key: "audit-logs",
      label: "Audit Logs",
      icon: <ScrollText className="size-4" />,
      permModule: "audit-logs",
    },
    {
      key: "reports",
      label: "Reports & Exports",
      icon: <BarChart3 className="size-4" />,
      permModule: null,
    },

    // System
    {
      key: "settings",
      label: "Platform Settings",
      icon: <Settings className="size-4" />,
      permModule: "settings",
    },
  ],
  admin: [
    {
      key: "module",
      label: "Dashboard",
      icon: <LayoutDashboard className="size-4" />,
    },
    // People Management
    { key: "students", label: "Students", icon: <GraduationCap className="size-4" /> },
    { key: "teachers", label: "Teachers", icon: <Users className="size-4" /> },
    { key: "parents", label: "Parents", icon: <Heart className="size-4" /> },
    { key: "staff", label: "Staff / Employees", icon: <UserPlus className="size-4" /> },
    
    // Academic Management
    { key: "academic-years", label: "Academic Years", icon: <CalendarDays className="size-4" /> },
    { key: "classes", label: "Classes", icon: <School className="size-4" /> },
    { key: "subjects", label: "Subjects", icon: <BookOpen className="size-4" /> },
    { key: "timetable", label: "Timetable", icon: <Clock className="size-4" /> },
    { key: "calendar", label: "Calendar", icon: <Calendar className="size-4" /> },

    // Operations
    {
      key: "attendance-group",
      label: "Attendance",
      icon: <UserCheck className="size-4" />,
      children: [
        { key: "attendance", label: "Student Attendance", icon: <Users className="size-4" /> },
        { key: "teacher-attendance", label: "Teacher Attendance", icon: <GraduationCap className="size-4" /> },
        { key: "staff-attendance", label: "Staff Attendance", icon: <Briefcase className="size-4" /> },
      ]
    },
    {
      key: "exam-management",
      label: "Exam Management",
      icon: <ClipboardList className="size-4" />,
      children: [
        { key: "exams", label: "Exams", icon: <ClipboardList className="size-4" /> },
        { key: "results-entry", label: "Results Entry", icon: <FileText className="size-4" /> },
        { key: "published-results", label: "Published Results", icon: <Trophy className="size-4" /> },
        { key: "admit-cards", label: "Admit Cards", icon: <IdCard className="size-4" /> },
        { key: "print-marksheet", label: "Print Marksheet", icon: <Award className="size-4" /> },
      ]
    },
    {
      key: "promotions-group",
      label: "Class Promotion",
      icon: <GraduationCap className="size-4" />,
      children: [
        { key: "promotions", label: "Promotions", icon: <ArrowRight className="size-4" /> },
        { key: "bulk-promote", label: "Bulk Promote", icon: <Zap className="size-4" /> },
        { key: "graduated", label: "Graduated", icon: <GraduationCap className="size-4" /> },
      ]
    },
    {
      key: "leave-management",
      label: "Leave Management",
      icon: <CalendarDays className="size-4" />,
      children: [
        { key: "student-leaves", label: "Student Leaves", icon: <GraduationCap className="size-4" /> },
        { key: "teacher-leaves", label: "Teacher Leaves", icon: <Briefcase className="size-4" /> },
        { key: "staff-leaves", label: "Staff Leaves", icon: <Users className="size-4" /> },
      ]
    },
    { key: "certificates", label: "Certificates", icon: <Award className="size-4" />, permModule: "students" },

    // Finance
    {
      key: "fees-group",
      label: "Fee Management",
      icon: <IndianRupee className="size-4" />,
      children: [
        { key: "fees", label: "Set Fees", icon: <Layers className="size-4" /> },
        { key: "fee-categories", label: "Fee Categories", icon: <Tag className="size-4" /> },
        { key: "fee-concessions", label: "Add Concession", icon: <Percent className="size-4" /> },
        { key: "make-payment", label: "Make Payment", icon: <Banknote className="size-4" /> },
        { key: "check-receipt", label: "Check Receipt", icon: <FileCheck className="size-4" /> },
        { key: "fee-status", label: "Fee Status", icon: <UserSearch className="size-4" /> },
        { key: "check-payments", label: "Check Payments", icon: <History className="size-4" /> },
        { key: "transport-fee", label: "Transport Fee", icon: <Bus className="size-4" /> },
      ]
    },
    { key: "expenses", label: "School Expenses", icon: <Wallet className="size-4" /> },
    
    // Communication & Support
    { key: "notices", label: "Notices", icon: <Bell className="size-4" /> },
    { key: "tickets", label: "Support Tickets", icon: <TicketCheck className="size-4" /> },

    // System
    { key: "roles", label: "Roles & Permissions", icon: <Shield className="size-4" /> },
    { key: "reports", label: "Reports", icon: <BarChart3 className="size-4" /> },
  ],
  teacher: [
    {
      key: "module",
      label: "Dashboard",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      key: "my-classes",
      label: "My Classes",
      icon: <School className="size-4" />,
    },
    {
      key: "my-subjects",
      label: "My Subjects",
      icon: <BookOpen className="size-4" />,
    },
    {
      key: "attendance-group",
      label: "Attendance",
      icon: <CalendarCheck className="size-4" />,
      children: [
        {
          key: "my-attendance",
          label: "My Attendance",
          icon: <UserCheck className="size-4" />,
        },
        {
          key: "take-attendance",
          label: "Student Attendance",
          icon: <Users className="size-4" />,
        },
      ]
    },
    {
      key: "grades-group",
      label: "Grades",
      icon: <TrendingUp className="size-4" />,
      children: [
        {
          key: "assessments",
          label: "Assessments",
          icon: <ClipboardList className="size-4" />,
        },
        {
          key: "school-exams",
          label: "School Exams",
          icon: <BookOpen className="size-4" />,
        },
      ]
    },
    {
      key: "homework-group",
      label: "Homework",
      icon: <FileText className="size-4" />,
      children: [
        {
          key: "homework",
          label: "Active Homework",
          icon: <ClipboardList className="size-4" />,
        },
        {
          key: "old-homework",
          label: "Old Homework",
          icon: <History className="size-4" />,
        },
      ]
    },
    {
      key: "leaves",
      label: "My Leaves",
      icon: <CalendarDays className="size-4" />,
    },
    {
      key: "timetable",
      label: "Timetable",
      icon: <Clock className="size-4" />,
    },
    { key: "notices", label: "Notices", icon: <Bell className="size-4" /> },
    {
      key: "calendar",
      label: "Calendar",
      icon: <Calendar className="size-4" />,
    },
    {
      key: "tickets",
      label: "Support Tickets",
      icon: <TicketCheck className="size-4" />,
    },
  ],
  student: [
    {
      key: "module",
      label: "Dashboard",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      key: "my-classes",
      label: "My Classes",
      icon: <School className="size-4" />,
    },
    {
      key: "grades-group",
      label: "My Grades",
      icon: <TrendingUp className="size-4" />,
      children: [
        {
          key: "school-exams",
          label: "School Exams",
          icon: <BookOpen className="size-4" />,
        },
      ]
    },
    {
      key: "assessments",
      label: "Assessments",
      icon: <ClipboardList className="size-4" />,
    },
    {
      key: "my-attendance",
      label: "Attendance",
      icon: <UserCheck className="size-4" />,
    },
    {
      key: "homework",
      label: "Homework",
      icon: <FileText className="size-4" />,
    },
    {
      key: "leaves",
      label: "My Leaves",
      icon: <CalendarDays className="size-4" />,
    },
    {
      key: "timetable",
      label: "Timetable",
      icon: <Clock className="size-4" />,
    },
    { key: "notices", label: "Notices", icon: <Bell className="size-4" /> },
    { key: "fees", label: "My Fees", icon: <CreditCard className="size-4" /> },
    {
      key: "calendar",
      label: "Calendar",
      icon: <Calendar className="size-4" />,
    },
    {
      key: "tickets",
      label: "Support Tickets",
      icon: <TicketCheck className="size-4" />,
    },
  ],
  parent: [
    {
      key: "module",
      label: "Dashboard",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      key: "children",
      label: "My Children",
      icon: <Users className="size-4" />,
    },
    {
      key: "homework",
      label: "Homework",
      icon: <FileText className="size-4" />,
    },
    {
      key: "grades-group",
      label: "Grades",
      icon: <TrendingUp className="size-4" />,
      children: [
        {
          key: "school-exams",
          label: "School Exams",
          icon: <BookOpen className="size-4" />,
        },
        {
          key: "assessments",
          label: "Assessments",
          icon: <ClipboardList className="size-4" />,
        },
      ]
    },
    {
      key: "attendance",
      label: "Attendance",
      icon: <UserCheck className="size-4" />,
    },
    { key: "fees", label: "Fees", icon: <CreditCard className="size-4" /> },
    { key: "notices", label: "Notices", icon: <Bell className="size-4" /> },
    {
      key: "timetable",
      label: "Timetable",
      icon: <Clock className="size-4" />,
    },
    {
      key: "subscription",
      label: "Subscription",
      icon: <Crown className="size-4" />,
    },
    {
      key: "calendar",
      label: "Calendar",
      icon: <Calendar className="size-4" />,
    },
    {
      key: "tickets",
      label: "Support Tickets",
      icon: <TicketCheck className="size-4" />,
    },
  ],
  staff: [
    {
      key: "module",
      label: "Dashboard",
      icon: <LayoutDashboard className="size-4" />,
      permModule: null,
    },
    // People Management
    {
      key: "students",
      label: "Students",
      icon: <GraduationCap className="size-4" />,
      permModule: "students",
    },
    {
      key: "teachers",
      label: "Teachers",
      icon: <Users className="size-4" />,
      permModule: "teachers",
    },
    
    // Academic Management
    {
      key: "academic-years",
      label: "Academic Years",
      icon: <CalendarDays className="size-4" />,
      permModule: "academic-years",
    },
    {
      key: "classes",
      label: "Classes",
      icon: <School className="size-4" />,
      permModule: "classes",
    },
    {
      key: "subjects",
      label: "Subjects",
      icon: <BookOpen className="size-4" />,
      permModule: "subjects",
    },
    {
      key: "timetable",
      label: "Timetable",
      icon: <Clock className="size-4" />,
      permModule: "timetable",
    },
    {
      key: "calendar",
      label: "Calendar",
      icon: <Calendar className="size-4" />,
      permModule: "calendar",
    },

    // Operations
    {
      key: "attendance-group",
      label: "Attendance",
      icon: <UserCheck className="size-4" />,
      permModule: null,
      children: [
        { key: "my-attendance", label: "My Attendance", icon: <UserCheck className="size-4" />, permModule: null },
        { key: "attendance", label: "Student Attendance", icon: <Users className="size-4" />, permModule: "attendance" },
        { key: "teacher-attendance", label: "Teacher Attendance", icon: <GraduationCap className="size-4" />, permModule: "attendance" },
        { key: "staff-attendance", label: "Staff Attendance", icon: <Briefcase className="size-4" />, permModule: "attendance" },
      ]
    },
    {
      key: "exam-management",
      label: "Exam Management",
      icon: <ClipboardList className="size-4" />,
      permModule: "exams",
      children: [
        { key: "exams", label: "Exams", icon: <ClipboardList className="size-4" /> },
        { key: "results-entry", label: "Results Entry", icon: <FileText className="size-4" /> },
        { key: "published-results", label: "Published Results", icon: <Trophy className="size-4" /> },
        { key: "admit-cards", label: "Admit Cards", icon: <IdCard className="size-4" /> },
        { key: "print-marksheet", label: "Print Marksheet", icon: <Award className="size-4" /> },
      ]
    },
    {
      key: "promotions-group",
      label: "Class Promotion",
      icon: <GraduationCap className="size-4" />,
      permModule: "promotions",
      children: [
        { key: "promotions", label: "Promotions", icon: <ArrowRight className="size-4" /> },
        { key: "bulk-promote", label: "Bulk Promote", icon: <Zap className="size-4" /> },
        { key: "graduated", label: "Graduated", icon: <GraduationCap className="size-4" /> },
      ]
    },
    {
      key: "leave-management",
      label: "Leave Management",
      icon: <CalendarDays className="size-4" />,
      permModule: "leaves",
      children: [
        { key: "student-leaves", label: "Student Leaves", icon: <GraduationCap className="size-4" /> },
        { key: "teacher-leaves", label: "Teacher Leaves", icon: <Briefcase className="size-4" /> },
        { key: "staff-leaves", label: "Staff Leaves", icon: <Users className="size-4" /> },
      ]
    },
    {
      key: "certificates",
      label: "Certificates",
      icon: <Award className="size-4" />,
      permModule: "certificates",
    },

    // Finance
    {
      key: "fees-group",
      label: "Fee Management",
      icon: <IndianRupee className="size-4" />,
      permModule: "fees",
      children: [
        { key: "fees", label: "Set Fees", icon: <Layers className="size-4" /> },
        { key: "fee-categories", label: "Fee Categories", icon: <Tag className="size-4" /> },
        { key: "fee-concessions", label: "Add Concession", icon: <Percent className="size-4" /> },
        { key: "make-payment", label: "Make Payment", icon: <Banknote className="size-4" /> },
        { key: "check-receipt", label: "Check Receipt", icon: <FileCheck className="size-4" /> },
        { key: "fee-status", label: "Fee Status", icon: <UserSearch className="size-4" /> },
        { key: "check-payments", label: "Check Payments", icon: <History className="size-4" /> },
        { key: "transport-fee", label: "Transport Fee", icon: <Bus className="size-4" /> },
      ]
    },
    {
      key: "expenses",
      label: "School Expenses",
      icon: <Wallet className="size-4" />,
      permModule: "expenses",
    },
    
    // Communication & Support
    {
      key: "notices",
      label: "Notices",
      icon: <Bell className="size-4" />,
      permModule: "notices",
    },
    {
      key: "tickets",
      label: "Support Tickets",
      icon: <TicketCheck className="size-4" />,
      permModule: "tickets",
    },
    {
      key: "reports",
      label: "Reports",
      icon: <BarChart3 className="size-4" />,
      permModule: "reports",
    },
  ],
};

export const roleColors: Record<UserRole, string> = {
  super_admin: "bg-teal-500",
  admin: "bg-emerald-500",
  teacher: "bg-blue-500",
  student: "bg-violet-500",
  parent: "bg-amber-500",
  staff: "bg-orange-500",
};

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  staff: "Staff",
};
