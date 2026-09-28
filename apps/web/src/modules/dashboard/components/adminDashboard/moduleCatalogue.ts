import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Award,
  BarChart3,
  Bell,
  Banknote,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  BedDouble,
  Bus,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Clapperboard,
  ClipboardList,
  Clock,
  DoorOpen,
  FileText,
  Flag,
  Gamepad2,
  Globe,
  GraduationCap,
  HeartPulse,
  IdCard,
  IndianRupee,
  Layers,
  Library,
  ListChecks,
  ListTodo,
  Medal,
  MessagesSquare,
  Newspaper,
  NotebookPen,
  School,
  ScrollText,
  Settings,
  Shield,
  SquarePen,
  Store,
  Tag,
  Trophy,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

export type ModuleTint =
  | "emerald"
  | "green"
  | "teal"
  | "cyan"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "amber"
  | "orange"
  | "rose"
  | "slate";

// Tailwind needs whole class names at build time, so tints are a lookup rather than
// `bg-${tone}-100` string interpolation.
export const TINT_CLASSES: Record<ModuleTint, string> = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
  green: "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400",
  cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export interface ModuleCard {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tint: ModuleTint;
  /**
   * The screen key to open, or null when the module is announced but not built.
   * A non-null value here MUST be a key in one of the two screen dispatchers —
   * modules/__tests__/module-catalogue.test.ts enforces that, because a card that
   * links an unknown key renders the tenant fallback and reads like an empty state.
   */
  screen: string | null;
  /** Permission module gating visibility. Must be a name the role permissions map uses. */
  permModule?: string;
  /**
   * Also a top-level module on the dark global rail. The rail reads its names, icons
   * and order from this catalogue so the two can never drift; a card without it is
   * reachable from the grid and from its parent module's panel, but not from the rail.
   */
  inRail?: boolean;
}

// Order is the grid order: the dashboard renders this array as-is, and buildAdminRail()
// reads its rail order from it too. Cards that live here but aren't in the reference
// grid sit next to their closest topic instead of trailing at the bottom.
export const moduleCatalogue: ModuleCard[] = [
  { id: "academics", title: "Academics", subtitle: "Subjects & syllabus", icon: GraduationCap, tint: "emerald", screen: "subjects", permModule: "subjects", inRail: true },
  { id: "timetable", title: "Timetable", subtitle: "Periods & schedule", icon: Clock, tint: "cyan", screen: "timetable", permModule: "timetable" },
  { id: "students", title: "Students", subtitle: "Admissions & records", icon: Users, tint: "emerald", screen: "students", permModule: "students", inRail: true },
  { id: "promotions", title: "Promotions", subtitle: "Class promotions", icon: School, tint: "purple", screen: "promotions", permModule: "promotions" },
  { id: "archive", title: "Graduated Students", subtitle: "Alumni records", icon: Archive, tint: "slate", screen: "graduated", permModule: "students" },
  { id: "certificates", title: "Certificates", subtitle: "Bonafide & transfer", icon: Award, tint: "emerald", screen: "certificates", permModule: "certificates" },

  { id: "employees", title: "Employees", subtitle: "Staff directory", icon: Briefcase, tint: "violet", screen: "staff", permModule: "staff", inRail: true },
  { id: "leaves", title: "Leaves", subtitle: "Apply & approve", icon: CalendarDays, tint: "teal", screen: "leaves", permModule: "leaves", inRail: true },
  { id: "student-attendance", title: "Students Attendance", subtitle: "Daily attendance", icon: CalendarCheck, tint: "amber", screen: "attendance", permModule: "attendance", inRail: true },
  { id: "employee-attendance", title: "Employees Attendance", subtitle: "Staff attendance", icon: IdCard, tint: "blue", screen: "staff-attendance", permModule: "attendance", inRail: true },

  { id: "money-book", title: "Money Book", subtitle: "Income & expenses", icon: Wallet, tint: "green", screen: "expenses", permModule: "expenses", inRail: true },
  { id: "payroll", title: "Employee Payroll", subtitle: "Salary & payslips", icon: Banknote, tint: "violet", screen: null },
  { id: "student-fees", title: "Student Fees", subtitle: "Fees & receipts", icon: IndianRupee, tint: "cyan", screen: "fees", permModule: "fees", inRail: true },
  { id: "transport", title: "Transport", subtitle: "Routes & tracking", icon: Bus, tint: "orange", screen: null },
  { id: "school-store", title: "School Store", subtitle: "Uniforms & supplies", icon: Store, tint: "amber", screen: null },

  { id: "examinations", title: "Examinations", subtitle: "Exams & results", icon: ClipboardList, tint: "rose", screen: "exams", permModule: "exams", inRail: true },
  { id: "tests", title: "Tests", subtitle: "Quick class tests", icon: SquarePen, tint: "rose", screen: "assessments", permModule: "exams" },
  { id: "homework", title: "Homework/Assignment", subtitle: "Assign & track", icon: BookOpen, tint: "violet", screen: "homework" },
  { id: "study-material", title: "Study Material", subtitle: "Notes & resources", icon: Layers, tint: "indigo", screen: null },
  { id: "school-diary", title: "School Diary", subtitle: "Notes to parents", icon: NotebookPen, tint: "amber", screen: null },
  { id: "houses", title: "Houses", subtitle: "Houses & points", icon: Flag, tint: "amber", screen: null },
  { id: "achievements", title: "Achievements", subtitle: "Awards & portfolios", icon: Trophy, tint: "emerald", screen: null },
  { id: "health", title: "Health & Fitness", subtitle: "Health & wellness", icon: HeartPulse, tint: "rose", screen: null },

  { id: "lesson-plan", title: "Lesson Plan", subtitle: "Curriculum & pacing", icon: CalendarDays, tint: "emerald", screen: null },
  { id: "letterhead", title: "Letterhead", subtitle: "Official letters & certificates", icon: FileText, tint: "green", screen: null },
  { id: "id-cards", title: "ID Cards", subtitle: "Design & issue", icon: IdCard, tint: "blue", screen: null },
  { id: "events", title: "Events", subtitle: "Calendar & notices", icon: Calendar, tint: "blue", screen: "calendar", permModule: "calendar" },
  { id: "library", title: "Library", subtitle: "Books & circulation", icon: Library, tint: "amber", screen: null },
  { id: "media-center", title: "Media Center", subtitle: "Files & documents", icon: Clapperboard, tint: "orange", screen: null },

  // Only a few of these group's cards have a screen; the rest render as "Soon".
  // A screen-less card stays off the rail: a rail module must open on a screen that routes.
  { id: "communications", title: "Communications", subtitle: "WhatsApp, SMS, email", icon: MessagesSquare, tint: "rose", screen: null },
  { id: "briefings", title: "Briefings", subtitle: "Reports on WhatsApp, Email", icon: Newspaper, tint: "rose", screen: null },
  { id: "notices", title: "Notices", subtitle: "Announcements", icon: Bell, tint: "indigo", screen: "notices", permModule: "notices" },
  { id: "grievances", title: "Grievances", subtitle: "Complaints & resolution", icon: Shield, tint: "rose", screen: "tickets", permModule: "tickets" },
  { id: "quizzes", title: "Quizzes", subtitle: "Quizzes & banks", icon: ListChecks, tint: "violet", screen: null },
  { id: "games", title: "Games", subtitle: "Learning arena", icon: Gamepad2, tint: "rose", screen: null },
  { id: "visitors", title: "Visitors", subtitle: "Gate entry register", icon: DoorOpen, tint: "blue", screen: null },
  { id: "hostel", title: "Hostel", subtitle: "Rooms & boarders", icon: BedDouble, tint: "teal", screen: null },
  { id: "admission-crm", title: "Admission CRM", subtitle: "Leads & enquiries", icon: Building2, tint: "indigo", screen: null },
  { id: "cms", title: "CMS", subtitle: "Website content", icon: Globe, tint: "orange", screen: null },

  { id: "users", title: "Users", subtitle: "Users & access", icon: UserCog, tint: "violet", screen: null },
  { id: "iam", title: "IAM", subtitle: "Roles & permissions", icon: Shield, tint: "violet", screen: "roles" },
  { id: "reports", title: "Reports", subtitle: "Exports & analytics", icon: BarChart3, tint: "violet", screen: "reports", permModule: "reports" },
  { id: "audit-logs", title: "Audit Logs", subtitle: "Activity trail", icon: ScrollText, tint: "indigo", screen: null },
  { id: "sports", title: "Sports", subtitle: "Events & scores", icon: Medal, tint: "slate", screen: null },
  { id: "tasks", title: "Tasks", subtitle: "Checklists & follow-ups", icon: ListTodo, tint: "slate", screen: null },
  { id: "assets", title: "Assets", subtitle: "Inventory & tracking", icon: Boxes, tint: "slate", screen: null },
  { id: "school-settings", title: "School Settings", subtitle: "Profile & preferences", icon: Settings, tint: "slate", screen: "school-settings", permModule: "settings" },
];

export const liveModuleCount = moduleCatalogue.filter((c) => c.screen !== null).length;
