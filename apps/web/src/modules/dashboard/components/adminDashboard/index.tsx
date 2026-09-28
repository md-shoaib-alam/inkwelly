"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useQuery } from "@tanstack/react-query";
import { useTenantResolution } from "@/lib/graphql/hooks/platform.hooks";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { differenceInDays } from "date-fns";
import {
  Bell,
  Calendar,
  Clock,
  School,
  Wallet,
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
  Heart,
  UserPlus,
  Shield,
  Crown,
  Settings,
} from "lucide-react";

import { ComprehensiveDashboard } from "./ComprehensiveDashboard";
import { MinimalDashboard } from "./MinimalDashboard";

function getDaysRemaining(endDate?: string | null) {
  if (!endDate) return null;
  const expiry = new Date(endDate);
  const now = new Date();
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return differenceInDays(expiry, now);
}

import { actionKeywords } from "@/components/layout/dashboard-keywords";

export function AdminDashboard() {
  const { push } = useRouter();
  const [recharts, setRecharts] = useState<typeof import("recharts") | null>(null);
  const [layoutPref, setLayoutPref] = useState<string>("comprehensive");
  const [searchQuery, setSearchQuery] = useState("");

  const { 
    currentUser, 
    currentTenantId, 
    currentTenantName, 
    currentTenantSlug, 
    currentTenantLogo,
    setCurrentScreen 
  } = useAppStore();

  useEffect(() => {
    // 🚀 Performance: Delay heavy chart library by 2s to prioritize core metrics on 3G
    const timer = setTimeout(() => {
      import("recharts").then(setRecharts);
    }, 2000);

    if (typeof window !== "undefined") {
      const pref = localStorage.getItem("schoolsaas_dashboard_layout_preference");
      if (pref) setLayoutPref(pref);
    }

    const handlePrefChange = (e: any) => {
      if (e.detail) setLayoutPref(e.detail);
    };

    window.addEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("schoolsaas_dashboard_layout_pref_changed", handlePrefChange);
    };
  }, []);

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
    const tid = currentTenantSlug || currentTenantId || currentUser?.tenantSlug || currentUser?.tenantId;
    if (tid) {
      push(`/${tid}/${screen}`);
    } else {
      push(`/${screen}`);
    }
  };

  const tenantId = currentTenantId || currentUser?.tenantId;

  // Optimized: Single network request for everything! (Disabled if layout preference is minimal)
  const { data: dashboardData, isPending, fetchStatus, error } = useQuery({
    queryKey: ['admin-dashboard', tenantId],
    queryFn: () => api.get('/dashboard'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (invalidated automatically on mutations)
    enabled: !!tenantId && layoutPref === "comprehensive",
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  // In React Query v5, when enabled:false, isPending=true but fetchStatus='idle'
  const isLoading = isPending && fetchStatus === 'fetching';

  useEffect(() => {
    if (error) {
      toast.error("Dashboard data failed to load", { description: (error as any).message });
    }
  }, [error]);

  // Subscription Check (uses cached resolve query, 0 network requests!)
  const { data: resolvedTenant } = useTenantResolution(currentTenantSlug || undefined);
  const daysRemaining = getDaysRemaining(resolvedTenant?.endDate);
  const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  const allAdminQuickActions = [
    // --- People Management ---
    {
      label: "Students",
      icon: <GraduationCap className="size-5" />,
      screen: "students",
      color: "bg-indigo-500 hover:bg-indigo-600",
      category: "People Management",
    },
    {
      label: "Teachers",
      icon: <Users className="size-5" />,
      screen: "teachers",
      color: "bg-blue-500 hover:bg-blue-600",
      category: "People Management",
    },
    {
      label: "Parents",
      icon: <Heart className="size-5" />,
      screen: "parents",
      color: "bg-pink-500 hover:bg-pink-600",
      category: "People Management",
    },
    {
      label: "Staff / Employees",
      icon: <UserPlus className="size-5" />,
      screen: "staff",
      color: "bg-orange-500 hover:bg-orange-600",
      category: "People Management",
    },

    // --- Academic Management ---
    {
      label: "Academic Years",
      icon: <CalendarDays className="size-5" />,
      screen: "academic-years",
      color: "bg-amber-500 hover:bg-amber-600",
      category: "Academic",
    },
    {
      label: "Classes",
      icon: <School className="size-5" />,
      screen: "classes",
      color: "bg-violet-500 hover:bg-violet-600",
      category: "Academic",
    },
    {
      label: "Subjects",
      icon: <BookOpen className="size-5" />,
      screen: "subjects",
      color: "bg-indigo-600 hover:bg-indigo-700",
      category: "Academic",
    },
    {
      label: "Timetable",
      icon: <Clock className="size-5" />,
      screen: "timetable",
      color: "bg-emerald-500 hover:bg-emerald-600",
      category: "Academic",
    },
    {
      label: "Calendar",
      icon: <Calendar className="size-5" />,
      screen: "calendar",
      color: "bg-rose-500 hover:bg-rose-600",
      category: "Academic",
    },

    // --- Attendance Group ---
    {
      label: "Student Attendance",
      icon: <Users className="size-5" />,
      screen: "attendance",
      color: "bg-sky-500 hover:bg-sky-600",
      category: "Attendance",
    },
    {
      label: "Teacher Attendance",
      icon: <GraduationCap className="size-5" />,
      screen: "teacher-attendance",
      color: "bg-blue-500 hover:bg-blue-600",
      category: "Attendance",
    },
    {
      label: "Staff Attendance",
      icon: <Briefcase className="size-5" />,
      screen: "staff-attendance",
      color: "bg-slate-500 hover:bg-slate-600",
      category: "Attendance",
    },

    // --- Exam Management ---
    {
      label: "Exams",
      icon: <ClipboardList className="size-5" />,
      screen: "exams",
      color: "bg-purple-500 hover:bg-purple-600",
      category: "Exams & Results",
    },
    {
      label: "Results Entry",
      icon: <FileText className="size-5" />,
      screen: "results-entry",
      color: "bg-indigo-500 hover:bg-indigo-600",
      category: "Exams & Results",
    },
    {
      label: "Published Results",
      icon: <Trophy className="size-5" />,
      screen: "published-results",
      color: "bg-amber-500 hover:bg-amber-600",
      category: "Exams & Results",
    },
    {
      label: "Admit Cards",
      icon: <IdCard className="size-5" />,
      screen: "admit-cards",
      color: "bg-sky-600 hover:bg-sky-700",
      category: "Exams & Results",
    },
    {
      label: "Print Marksheet",
      icon: <Award className="size-5" />,
      screen: "print-marksheet",
      color: "bg-violet-600 hover:bg-violet-700",
      category: "Exams & Results",
    },

    // --- Promotions Group ---
    {
      label: "Promotions",
      icon: <ArrowRight className="size-5" />,
      screen: "promotions",
      color: "bg-emerald-500 hover:bg-emerald-600",
      category: "Promotions & Leaves",
    },
    {
      label: "Bulk Promote",
      icon: <Zap className="size-5" />,
      screen: "bulk-promote",
      color: "bg-yellow-500 hover:bg-yellow-600",
      category: "Promotions & Leaves",
    },
    {
      label: "Graduated",
      icon: <GraduationCap className="size-5" />,
      screen: "graduated",
      color: "bg-teal-500 hover:bg-teal-600",
      category: "Promotions & Leaves",
    },

    // --- Leave Management ---
    {
      label: "Student Leaves",
      icon: <GraduationCap className="size-5" />,
      screen: "student-leaves",
      color: "bg-violet-500 hover:bg-violet-600",
      category: "Promotions & Leaves",
    },
    {
      label: "Teacher Leaves",
      icon: <Briefcase className="size-5" />,
      screen: "teacher-leaves",
      color: "bg-blue-500 hover:bg-blue-600",
      category: "Promotions & Leaves",
    },
    {
      label: "Staff Leaves",
      icon: <Users className="size-5" />,
      screen: "staff-leaves",
      color: "bg-slate-500 hover:bg-slate-600",
      category: "Promotions & Leaves",
    },

    // --- Certificates ---
    {
      label: "Certificates",
      icon: <Award className="size-5" />,
      screen: "certificates",
      color: "bg-teal-600 hover:bg-teal-700",
      category: "Academic",
    },

    // --- Fees Group ---
    {
      label: "Set Fees",
      icon: <Layers className="size-5" />,
      screen: "fees",
      color: "bg-emerald-500 hover:bg-emerald-600",
      category: "Fees & Finance",
    },
    {
      label: "Fee Categories",
      icon: <Tag className="size-5" />,
      screen: "fee-categories",
      color: "bg-teal-500 hover:bg-teal-600",
      category: "Fees & Finance",
    },
    {
      label: "Add Concession",
      icon: <Percent className="size-5" />,
      screen: "fee-concessions",
      color: "bg-green-500 hover:bg-green-600",
      category: "Fees & Finance",
    },
    {
      label: "Make Payment",
      icon: <Banknote className="size-5" />,
      screen: "make-payment",
      color: "bg-emerald-600 hover:bg-emerald-700",
      keywords: ["invoice", "bill", "pay", "fees"],
      category: "Fees & Finance",
    },
    {
      label: "Check Receipt",
      icon: <FileCheck className="size-5" />,
      screen: "check-receipt",
      color: "bg-teal-600 hover:bg-teal-700",
      keywords: ["invoice", "receipt", "bill", "payment check"],
      category: "Fees & Finance",
    },
    {
      label: "Fee Status",
      icon: <UserSearch className="size-5" />,
      screen: "fee-status",
      color: "bg-emerald-500 hover:bg-emerald-600",
      category: "Fees & Finance",
    },
    {
      label: "Check Payments",
      icon: <History className="size-5" />,
      screen: "check-payments",
      color: "bg-zinc-600 hover:bg-zinc-700",
      category: "Fees & Finance",
    },
    {
      label: "Transport Fee",
      icon: <Bus className="size-5" />,
      screen: "transport-fee",
      color: "bg-amber-600 hover:bg-amber-700",
      category: "Fees & Finance",
    },

    // --- School Expenses ---
    {
      label: "School Expenses",
      icon: <Wallet className="size-5" />,
      screen: "expenses",
      color: "bg-rose-500 hover:bg-rose-600",
      keywords: ["spending", "payment", "bill", "payout", "invoice"],
      category: "Fees & Finance",
    },

    // --- Notices & Support ---
    {
      label: "Notices",
      icon: <Bell className="size-5" />,
      screen: "notices",
      color: "bg-amber-500 hover:bg-amber-600",
      category: "Administration",
    },
    {
      label: "Support Tickets",
      icon: <TicketCheck className="size-5" />,
      screen: "tickets",
      color: "bg-cyan-500 hover:bg-cyan-600",
      category: "Administration",
    },
    {
      label: "Roles & Permissions",
      icon: <Shield className="size-5" />,
      screen: "roles",
      color: "bg-red-500 hover:bg-red-600",
      category: "Administration",
    },
    {
      label: "My Subscription",
      icon: <Crown className="size-5" />,
      screen: "school-subscription",
      color: "bg-yellow-600 hover:bg-yellow-700",
      category: "Administration",
    },
    {
      label: "School Settings",
      icon: <Settings className="size-5" />,
      screen: "school-settings",
      color: "bg-zinc-700 hover:bg-zinc-800",
      category: "Administration",
    },
    {
      label: "Reports",
      icon: <BarChart3 className="size-5" />,
      screen: "reports",
      color: "bg-indigo-500 hover:bg-indigo-600",
      category: "Administration",
    },
  ];

  const filteredQuickActions = allAdminQuickActions.filter((action) => {
    const query = searchQuery.toLowerCase();
    const labelMatch = action.label.toLowerCase().includes(query);
    const kws = actionKeywords[action.screen] || [];
    const keywordsMatch = kws.some((kw) => kw.toLowerCase().includes(query));
    return labelMatch || keywordsMatch;
  });

  if (layoutPref === "minimal") {
    return (
      <MinimalDashboard
        filteredQuickActions={filteredQuickActions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        navigateTo={navigateTo}
        isExpired={isExpired}
        isExpiringSoon={isExpiringSoon}
        daysRemaining={daysRemaining}
        tenantId={tenantId || null}
        currentTenantSlug={currentTenantSlug || null}
      />
    );
  }

  return (
    <ComprehensiveDashboard
      isLoading={isLoading}
      dashboardData={dashboardData}
      recharts={recharts}
      isExpired={isExpired}
      isExpiringSoon={isExpiringSoon}
      daysRemaining={daysRemaining}
      tenantId={tenantId || null}
      currentTenantSlug={currentTenantSlug || null}
      currentTenantName={currentTenantName}
      currentTenantLogo={currentTenantLogo}
      currentUser={currentUser}
    />
  );
}
