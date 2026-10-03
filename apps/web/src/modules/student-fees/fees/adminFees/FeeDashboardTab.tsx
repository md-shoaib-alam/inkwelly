"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTenantHref } from "@/modules/academics/hooks/use-tenant-href";
import {
  Search,
  ArrowRight,
  Landmark,
  Wallet,
  AlertCircle,
  History,
  GitFork,
  ExternalLink,
  Radio,
  FileText,
  Percent,
  Receipt,
  Users,
  Calendar,
  CalendarDays,
  LineChart as LineChartIcon,
  BarChart2,
  Trophy,
  CreditCard,
  TrendingUp,
  Gift,
  Shirt,
  GraduationCap,
  Shield,
} from "lucide-react";
import { useFeeReceipts } from "@/modules/student-fees/fees/hooks/use-fees";
import { format } from "date-fns";

interface FeeDashboardTabProps {
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface Defaulter {
  id: string;
  name: string;
  avatar?: string;
  className: string;
  section: string;
  stream?: string;
  overdueDays: number;
  dueAmount: number;
  invoicesCount: number;
}

const DEFAULT_DEFAULTERS: Defaulter[] = [
  {
    id: "def-1",
    name: "Ibrahim Menon",
    className: "Class 10th",
    section: "A",
    stream: "A",
    overdueDays: 79,
    dueAmount: 94800,
    invoicesCount: 2,
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "def-2",
    name: "Mohammed Joshi",
    className: "Class 10th",
    section: "A",
    stream: "A",
    overdueDays: 79,
    dueAmount: 56000,
    invoicesCount: 2,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "def-3",
    name: "Aisha Khan",
    className: "Class 9th",
    section: "B",
    stream: "A",
    overdueDays: 60,
    dueAmount: 42500,
    invoicesCount: 1,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "def-4",
    name: "Aarav Patel",
    className: "Class 8th",
    section: "C",
    stream: "A",
    overdueDays: 45,
    dueAmount: 38200,
    invoicesCount: 1,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "def-5",
    name: "Zoya Fatima",
    className: "Class 10th",
    section: "B",
    stream: "B",
    overdueDays: 30,
    dueAmount: 27400,
    invoicesCount: 1,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
  },
];

const RECENT_ACTIVITIES = [
  {
    id: "act-1",
    title: "Invoice generated · Ibrahim Ansari",
    subtitle: "Rajendra A Verma · 17 Aug, 04:30 pm",
    amount: "₹39,000",
    time: "Today",
    status: "invoice",
  },
  {
    id: "act-2",
    title: "Fee Receipt #REC-2026-089 generated",
    subtitle: "Rohan Sharma · Class 10-A · Online (UPI)",
    amount: "₹12,500",
    time: "2 hours ago",
    status: "success",
  },
  {
    id: "act-3",
    title: "Late Fee Waiver applied",
    subtitle: "Approved by Admin for Priya Verma (Class 8-B)",
    amount: "-₹500",
    time: "4 hours ago",
    status: "concession",
  },
  {
    id: "act-4",
    title: "Cheque Cleared #CHQ-88901",
    subtitle: "Kavya Singhania · Class 11-Commerce",
    amount: "₹24,000",
    time: "Yesterday",
    status: "success",
  },
];

// Generate calendar heatmap grid data (16 columns x 7 rows = ~112 days from 15 Jun to 02 Oct)
const CALENDAR_HEATMAP_DATA = [
  // col 0
  [0, 0, 0, 0, 0, 0, 0],
  // col 1
  [0, 0, 0, 0, 0, 0, 0],
  // col 2
  [0, 3, 0, 0, 0, 0, 0],
  // col 3
  [0, 0, 0, 0, 0, 0, 0],
  // col 4
  [0, 0, 1, 0, 0, 0, 0],
  // col 5
  [0, 0, 0, 0, 0, 0, 0],
  // col 6
  [0, 0, 0, 0, 0, 0, 0],
  // col 7
  [0, 0, 0, 0, 0, 0, 0],
  // col 8
  [0, 0, 0, 0, 0, 0, 0],
  // col 9
  [0, 1, 0, 0, 0, 0, 0],
  // col 10
  [0, 0, 0, 0, 0, 0, 0],
  // col 11
  [0, 0, 1, 0, 0, 0, 0],
  // col 12
  [0, 0, 0, 1, 0, 0, 0],
  // col 13
  [0, 0, 0, 0, 0, 0, 0],
  // col 14
  [0, 0, 0, 0, 0, 0, 0],
  // col 15
  [1, 0, 1, 0, 1, 0, 2],
];

export function FeeDashboardTab({ canCreate, canEdit, canDelete }: FeeDashboardTabProps) {
  const router = useRouter();
  const tenantHref = useTenantHref();
  const [collectionTab, setCollectionTab] = useState<"today" | "yesterday">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [trendRange, setTrendRange] = useState<"Today" | "Yesterday" | "7D" | "30D" | "This month" | "Session">("30D");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [trendFrequency, setTrendFrequency] = useState<"Daily" | "Monthly">("Daily");
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Optional real API receipt stats
  const { data: statsData } = useFeeReceipts({
    limit: 5,
    mode: "stats",
  }) as any;

  const filteredDefaulters = useMemo(() => {
    if (!searchQuery.trim()) return DEFAULT_DEFAULTERS;
    const q = searchQuery.toLowerCase();
    return DEFAULT_DEFAULTERS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.className.toLowerCase().includes(q) ||
        d.dueAmount.toString().includes(q)
    );
  }, [searchQuery]);

  const currentDateFormatted = useMemo(() => {
    try {
      return format(new Date(), "EEE, d MMM, yyyy");
    } catch {
      return "Fri, 2 Oct, 2026";
    }
  }, []);

  return (
    <div className="space-y-5 pb-12">
      {/* ── 1. Hero Banner: section.fd-hero ─────────────────────────── */}
      <section className="fd-hero">
        {/* Subtle background radial glow & grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#14544b,transparent_70%)] pointer-events-none" />
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating golden coins */}
        {/* Left coin */}
        <div
          className="fd-coin"
          style={{
            top: "32px",
            left: "60px",
            width: "36px",
            height: "36px",
            background: "linear-gradient(135deg, #fce9a4 0%, #e5a93c 100%)",
            color: "#4a3205",
            fontSize: "15px",
            transform: "rotate(-16deg)",
            boxShadow: "0 6px 16px -2px rgba(229, 169, 60, 0.5)",
          }}
        >
          ₹
        </div>

        {/* Right coin */}
        <div
          className="fd-coin"
          style={{
            top: "28px",
            right: "72px",
            width: "34px",
            height: "34px",
            background: "linear-gradient(135deg, #fce9a4 0%, #e5a93c 100%)",
            color: "#4a3205",
            fontSize: "14px",
            transform: "rotate(12deg)",
            boxShadow: "0 6px 16px -2px rgba(229, 169, 60, 0.5)",
          }}
        >
          ₹
        </div>

        {/* Lower left faint coin */}
        <div
          className="fd-coin opacity-40"
          style={{
            bottom: "26px",
            left: "140px",
            width: "28px",
            height: "28px",
            background: "linear-gradient(135deg, #fce9a4 0%, #e5a93c 100%)",
            color: "#4a3205",
            fontSize: "12px",
            transform: "rotate(24deg)",
          }}
        >
          ₹
        </div>

        {/* Subtle sparkle stars */}
        <span
          className="fd-hero-sparkle text-teal-200/50 text-xs"
          style={{ top: "24px", left: "22%" }}
        >
          ✦
        </span>
        <span
          className="fd-hero-sparkle text-amber-200/60 text-xs"
          style={{ top: "34px", right: "24%" }}
        >
          ✦
        </span>
        <span
          className="fd-hero-sparkle text-teal-300/40 text-[10px]"
          style={{ bottom: "28px", right: "15%" }}
        >
          ✦
        </span>

        {/* Hero Content */}
        <div className="relative z-10 text-center space-y-4">
          {/* Centered Heading */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-amber-200/40" />
            <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-wide flex items-center gap-2">
              <span className="font-semibold text-white">Fee</span>{" "}
              <span
                className="italic font-serif text-[#FCE9A4]"
                style={{
                  fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
                  letterSpacing: "0.02em",
                }}
              >
                dashboard
              </span>
            </h1>
            <span className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-amber-200/40" />
          </div>

          {/* Search bar inside hero */}
          <div className="max-w-[560px] mx-auto bg-white rounded-full p-1 pl-4 flex items-center shadow-lg border border-white/20 gap-2 transition-all focus-within:ring-2 focus-within:ring-[#e5a93c]">
            <Search className="w-4 h-4 text-[#0D9488] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, admission no. or phone"
              className="flex-1 bg-transparent border-0 outline-none text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm font-medium"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10.5px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200 select-none">
              ⌘ K
            </kbd>
            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  router.push(tenantHref(`student-fees/fee-status?q=${encodeURIComponent(searchQuery)}`));
                }
              }}
              className="w-8 h-8 rounded-full bg-[#E5A93C] hover:bg-[#D99B2F] text-[#0A2E27] flex items-center justify-center font-bold shadow-sm transition-transform hover:scale-105 shrink-0"
              title="Search"
            >
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Summary KPI Cards (4 cards) ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net payable */}
        <div className="bg-white dark:bg-card rounded-2xl p-4.5 shadow-xs border border-slate-100 dark:border-slate-800/80 flex items-center gap-3.5 transition-all hover:shadow-md">
          <div className="w-11 h-11 rounded-xl bg-[#FFF8E7] dark:bg-amber-950/40 text-[#B45309] dark:text-amber-400 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Net payable</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              ₹1,21,00,425
            </p>
          </div>
        </div>

        {/* Total paid */}
        <div className="bg-white dark:bg-card rounded-2xl p-4.5 shadow-xs border border-slate-100 dark:border-slate-800/80 flex items-center gap-3.5 transition-all hover:shadow-md">
          <div className="w-11 h-11 rounded-xl bg-[#E6F7F2] dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total paid</p>
            <p className="text-xl font-bold text-[#059669] dark:text-emerald-400 tracking-tight">
              ₹97,64,800
            </p>
          </div>
        </div>

        {/* Total due */}
        <div className="bg-white dark:bg-card rounded-2xl p-4.5 shadow-xs border border-slate-100 dark:border-slate-800/80 flex items-center gap-3.5 transition-all hover:shadow-md">
          <div className="w-11 h-11 rounded-xl bg-[#FDF2F2] dark:bg-rose-950/40 text-[#DC2626] dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total due</p>
            <p className="text-xl font-bold text-[#DC2626] dark:text-rose-400 tracking-tight">
              ₹24,91,625
            </p>
          </div>
        </div>

        {/* Carry-forward due */}
        <div className="bg-white dark:bg-card rounded-2xl p-4.5 shadow-xs border border-slate-100 dark:border-slate-800/80 flex items-center gap-3.5 transition-all hover:shadow-md">
          <div className="w-11 h-11 rounded-xl bg-[#F3E8FF] dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Carry-forward due</p>
            <p className="text-xl font-bold text-[#7C3AED] dark:text-purple-400 tracking-tight">
              ₹10,000
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Main 2-Column Grid (.fd-two) ─────────────────────────── */}
      <div className="fd-two">
        {/* ── LEFT COLUMN: Money Flow & Net Payable Breakdown ──────── */}
        <div className="space-y-4 flex flex-col">
          {/* Money flow card */}
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E8F8F5] dark:bg-teal-950/50 text-[#0D9488] dark:text-teal-400 flex items-center justify-center">
                  <GitFork className="w-4.5 h-4.5 rotate-90" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Money flow</h3>
              </div>
              <button
                onClick={() => router.push(tenantHref("student-fees/check-receipt"))}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                Invoices <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Circular Gauge / Donut + Net Payable Stats */}
            <div className="bg-[#F8FAF9] dark:bg-slate-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-6">
              {/* Donut Chart */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background track circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-[#FDE8E8] dark:stroke-slate-800"
                    strokeWidth="10"
                    fill="none"
                  />
                  {/* Progress arc (80.7% = 202.8 of 251.3 circumference) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-[#0D9488]"
                    strokeWidth="10"
                    strokeDasharray="251.3"
                    strokeDashoffset="48.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                    80.7%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">collected</span>
                </div>
              </div>

              {/* Net payable & Sub-metrics */}
              <div className="flex-1 min-w-0 space-y-3 w-full">
                <div>
                  <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    NET PAYABLE
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    ₹1,21,00,425
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="border-l-2 border-[#0D9488] pl-2.5">
                    <span className="text-xs text-slate-400 block">Collected</span>
                    <span className="text-sm font-bold text-[#059669] dark:text-emerald-400 block">
                      ₹97,64,800
                    </span>
                  </div>
                  <div className="border-l-2 border-[#DC2626] pl-2.5">
                    <span className="text-xs text-slate-400 block">Due</span>
                    <span className="text-sm font-bold text-[#DC2626] dark:text-rose-400 block">
                      ₹24,91,625
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* HOW NET PAYABLE IS BUILT */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                HOW NET PAYABLE IS BUILT
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BILLED Box */}
                <div className="border border-slate-100 dark:border-slate-800 bg-[#FCFDFD] dark:bg-slate-900/30 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">BILLED</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ₹1,21,11,725
                    </span>
                  </div>

                  <div className="h-1 w-full bg-blue-500/80 rounded-full" />

                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Gross fee
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹1,19,29,000</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Late fees
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹1,72,125</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Fines
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹600</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Previous dues
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹10,000</span>
                    </div>
                  </div>
                </div>

                {/* CONCESSIONS Box */}
                <div className="border border-slate-100 dark:border-slate-800 bg-[#FCFDFD] dark:bg-slate-900/30 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                        <Percent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">CONCESSIONS</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      -₹11,400
                    </span>
                  </div>

                  <div className="h-1 w-full bg-blue-500 rounded-full" />

                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Discounts
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹11,400</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Scholarships
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹0</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Waivers
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Equation Strip */}
              <div className="bg-[#EBF7FD] dark:bg-sky-950/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <span>₹1,21,11,725</span>
                  <span className="text-slate-400">-</span>
                  <span>₹11,400</span>
                  <span className="text-slate-400">=</span>
                </div>
                <span className="text-teal-800 dark:text-teal-300 font-bold text-sm sm:text-base">
                  ₹1,21,00,425
                </span>
              </div>
            </div>
          </div>

          {/* Recent activity card */}
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Recent activity</h4>
              </div>
              <button
                onClick={() => router.push(tenantHref("student-fees/check-payments"))}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {RECENT_ACTIVITIES.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{act.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{act.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-bold ${
                        act.status === "concession"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {act.amount}
                    </p>
                    <p className="text-[10px] text-slate-400">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Daily Collection & Top Defaulters ───────── */}
        <div className="space-y-4 flex flex-col">
          {/* Daily collection card */}
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
            {/* Header + Tabs Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Radio className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                    Daily collection
                  </h3>
                  <p className="text-xs text-slate-400">{currentDateFormatted}</p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="bg-[#FAF7ED] dark:bg-slate-800/80 p-0.5 rounded-full flex items-center border border-amber-200/50 dark:border-slate-700">
                <button
                  type="button"
                  role="tab"
                  className="fd-head"
                  data-active={collectionTab === "today"}
                  onClick={() => setCollectionTab("today")}
                >
                  Today
                </button>
                <button
                  type="button"
                  role="tab"
                  className="fd-head"
                  data-active={collectionTab === "yesterday"}
                  onClick={() => setCollectionTab("yesterday")}
                >
                  Yesterday
                </button>
              </div>
            </div>

            {/* Collected Mint Box */}
            <div className="bg-[#E8F8F5] dark:bg-emerald-950/20 rounded-2xl p-4 flex items-center justify-between border border-teal-100 dark:border-teal-900/30">
              <div>
                <p className="text-xs font-semibold text-teal-800 dark:text-teal-300">Collected</p>
                <p className="text-3xl font-extrabold text-teal-700 dark:text-teal-400 tracking-tight">
                  {collectionTab === "today" ? "₹0" : "₹48,500"}
                </p>
                <p className="text-xs text-teal-700/80 dark:text-teal-400/70 mt-0.5">
                  {collectionTab === "today" ? "0 payments" : "4 payments"}
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/60 px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 border border-rose-200/50 shadow-xs">
                <span>↘</span> -100% vs yesterday
              </div>
            </div>

            {/* Latest payments section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Latest payments {collectionTab}
                </span>
                <button
                  onClick={() => router.push(tenantHref("student-fees/check-payments"))}
                  className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-0.5"
                >
                  View all →
                </button>
              </div>

              {/* Empty state when 0 payments */}
              {collectionTab === "today" ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No payment recorded today yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Ananya Verma</p>
                      <p className="text-[11px] text-slate-400">Class 9th-A · UPI</p>
                    </div>
                    <span className="font-bold text-emerald-600">₹18,500</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Reyansh Gupta</p>
                      <p className="text-[11px] text-slate-400">Class 6th-B · Cash</p>
                    </div>
                    <span className="font-bold text-emerald-600">₹30,000</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top defaulters card */}
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3.5 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                    Top defaulters
                  </h3>
                  <p className="text-xs text-slate-400">Highest outstanding balances</p>
                </div>
              </div>
              <button
                onClick={() => router.push(tenantHref("student-fees/fee-status"))}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                View all ↗
              </button>
            </div>

            {/* List of defaulters */}
            <div className="space-y-2.5 pt-1">
              {filteredDefaulters.map((defaulter) => (
                <div
                  key={defaulter.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900/20 flex items-center justify-between gap-3 transition-colors"
                >
                  {/* Left: Avatar & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {defaulter.avatar ? (
                      <img
                        src={defaulter.avatar}
                        alt={defaulter.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {defaulter.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {defaulter.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {defaulter.className} · {defaulter.section} · {defaulter.stream} ·{" "}
                        <span className="text-rose-500 font-medium">
                          {defaulter.overdueDays} days overdue
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount, Invoices, Open Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 leading-tight">
                        ₹{defaulter.dueAmount.toLocaleString()}
                      </p>
                      <p className="text-[10.5px] text-slate-400">
                        {defaulter.invoicesCount} {defaulter.invoicesCount === 1 ? "invoice" : "invoices"}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        router.push(
                          tenantHref(`student-fees/make-payment?student=${encodeURIComponent(defaulter.name)}`)
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      Open ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Collection Trend Card (Full Width) ───────────────────── */}
      <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
        {/* Top Header Row with Title, Total, Badges and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Collection trend</h3>
            <span className="text-xl font-extrabold text-teal-700 dark:text-teal-400">₹81,000</span>
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
              ↗ +4.2%
            </span>
          </div>

          {/* Right Toolbar: Period pills, Custom date, Chart type toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Pills */}
            <div className="bg-[#FAF7ED] dark:bg-slate-800/80 p-0.5 rounded-full flex items-center border border-amber-200/40 dark:border-slate-700 text-xs">
              {(["Today", "Yesterday", "7D", "30D", "This month", "Session"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendRange(period)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    trendRange === period
                      ? "bg-[#E5A93C] text-[#06201C] shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Custom Date Button */}
            <button className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Custom
            </button>

            {/* Line / Bar chart view toggle */}
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={() => setChartType("line")}
                className={`p-1.5 rounded-lg transition-colors ${
                  chartType === "line"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Line chart"
              >
                <LineChartIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-lg transition-colors ${
                  chartType === "bar"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
                title="Bar chart"
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Subtitle info + Daily/Monthly toggle + Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span>03 Sept — 02 Oct 2026 · daily</span>
            <span>·</span>
            <span>
              Avg per day <strong className="text-slate-800 dark:text-slate-200">₹2,700</strong>
            </span>
            <span>·</span>
            <span>
              Best <strong className="text-teal-700 dark:text-teal-400">₹41,000</strong> · Sunday, 27 Sept
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Daily / Monthly toggle */}
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full flex items-center text-xs">
              {(["Daily", "Monthly"] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setTrendFrequency(freq)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                    trendFrequency === freq
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-3.5 h-0.5 bg-[#0D9488] rounded-full inline-block" /> Collected
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-3.5 h-0.5 border-t border-dashed border-amber-500 inline-block" /> Billed
              </span>
            </div>
          </div>
        </div>

        {/* SVG Chart Area */}
        <div className="relative pt-2 pb-1">
          {chartType === "line" ? (
            <div className="w-full h-56 relative">
              <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Y-axis Gridlines */}
                {[0, 50, 100, 150, 190].map((y) => (
                  <line
                    key={y}
                    x1="45"
                    y1={y}
                    x2="990"
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800/80"
                    strokeWidth="1"
                    strokeDasharray={y < 190 ? "4 4" : "none"}
                  />
                ))}

                {/* Billed dashed baseline */}
                <line
                  x1="50"
                  y1="190"
                  x2="980"
                  y2="190"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Collected Area Fill */}
                <path
                  d="M 50 190 L 800 190 Q 820 190, 830 110 T 845 80 Q 855 110, 860 190 L 920 190 Q 935 190, 945 100 T 960 90 Q 970 120, 980 190 Z"
                  fill="url(#trendGradient)"
                />

                {/* Collected Spline Stroke */}
                <path
                  d="M 50 190 L 800 190 Q 820 190, 830 110 T 845 80 Q 855 110, 860 190 L 920 190 Q 935 190, 945 100 T 960 90 Q 970 120, 980 190"
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* Y-axis Labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-medium text-slate-400 select-none">
                <span>₹80K</span>
                <span>₹60K</span>
                <span>₹40K</span>
                <span>₹20K</span>
                <span>₹0</span>
              </div>
            </div>
          ) : (
            /* Bar Chart View */
            <div className="w-full h-56 relative flex items-end pl-12 pr-4 pb-6">
              {/* Bars container */}
              <div className="w-full h-full flex items-end justify-between gap-1 pt-4 border-b border-slate-100 dark:border-slate-800">
                {Array.from({ length: 30 }).map((_, idx) => {
                  const isPeak1 = idx === 25; // 27 Sept
                  const isPeak2 = idx === 29; // 02 Oct
                  const height = isPeak1 ? "68%" : isPeak2 ? "62%" : "2px";
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col justify-end items-center h-full group relative"
                    >
                      <div
                        style={{ height }}
                        className={`w-full max-w-[26px] rounded-t-sm transition-all duration-300 ${
                          isPeak1 || isPeak2
                            ? "bg-[#0D9488] hover:bg-teal-600 shadow-sm"
                            : "bg-[#0D9488]/40 hover:bg-[#0D9488]"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Y-axis Labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-medium text-slate-400 select-none">
                <span>₹80K</span>
                <span>₹60K</span>
                <span>₹40K</span>
                <span>₹20K</span>
                <span>₹0</span>
              </div>
            </div>
          )}

          {/* X-axis Timeline Labels */}
          <div className="flex justify-between text-[11px] font-medium text-slate-400 pl-11 pr-2 pt-1 select-none">
            <span>03 Sept</span>
            <span>07 Sept</span>
            <span>11 Sept</span>
            <span>15 Sept</span>
            <span>19 Sept</span>
            <span>23 Sept</span>
            <span>27 Sept</span>
            <span>02 Oct</span>
          </div>
        </div>
      </div>

      {/* ── 5. Fines & Concessions Given Row (2 Cards) ──────────────── */}
      <div className="fd-two">
        {/* Card 1: Fines */}
        <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  Fines
                </h3>
                <p className="text-xs text-slate-400">
                  3 fines · late fee on 88 bills this session
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(tenantHref("student-fees/late-fees"))}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              Late fees <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Inner Highlight Container */}
          <div className="bg-[#FAF8F5] dark:bg-slate-900/40 rounded-2xl p-4 space-y-3 border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  TOTAL APPLIED
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ₹1,74,825
                </span>
              </div>
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                2% recovered
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: "3%" }} className="bg-[#0D9488] h-full" title="Collected ₹4,000" />
              <div style={{ width: "2%" }} className="bg-[#3B82F6] h-full" title="Waived ₹2,100" />
              <div style={{ width: "95%" }} className="bg-[#F87171] h-full" title="Due ₹1,68,725" />
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#0D9488]" /> Collected
                </span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">₹4,000</p>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Waived
                </span>
                <p className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">₹2,100</p>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Due
                </span>
                <p className="font-bold text-rose-600 dark:text-rose-400 text-sm mt-0.5">₹1,68,725</p>
              </div>
            </div>
          </div>

          {/* BY TYPE */}
          <div className="space-y-3 pt-1">
            <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              BY TYPE
            </span>

            {/* Late fees */}
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Late fees</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">88 bills</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">₹1,74,125</span>
                </div>
              </div>
              <div className="w-full h-1 bg-rose-500 rounded-full" />
            </div>

            {/* Uniform */}
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-500">
                    <Shirt className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Uniform</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">3 fines</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">₹700</span>
                </div>
              </div>
              <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>

        {/* Card 2: Concessions given */}
        <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-500 flex items-center justify-center">
                <Gift className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  Concessions given
                </h3>
                <p className="text-xs text-slate-400">
                  2 students benefited this session
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(tenantHref("student-fees/fee-concessions"))}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              Set up <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Inner Highlight Container */}
          <div className="bg-[#FAF8F5] dark:bg-slate-900/40 rounded-2xl p-4 space-y-3 border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  TOTAL FOREGONE
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ₹11,400
                </span>
              </div>
              <span className="bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400 border border-pink-200/50 dark:border-pink-800/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                0.1% of gross fee
              </span>
            </div>

            {/* Horizontal Bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: "100%" }} className="bg-[#E5A93C] h-full" />
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#E5A93C]" /> Discounts
                </span>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">₹11,400</p>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED]" /> Scholarships
                </span>
                <p className="font-bold text-purple-600 dark:text-purple-400 text-sm mt-0.5">₹0</p>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#0D9488]" /> Waivers
                </span>
                <p className="font-bold text-teal-600 dark:text-teal-400 text-sm mt-0.5">₹0</p>
              </div>
            </div>
          </div>

          {/* BY TYPE */}
          <div className="space-y-3 pt-1">
            <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              BY TYPE
            </span>

            {/* Discounts */}
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Discounts</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">2 students</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">₹11,400</span>
                </div>
              </div>
              <div className="w-full h-1 bg-[#B45309] rounded-full" />
            </div>

            {/* Scholarships */}
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Scholarships</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">0 students</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">₹0</span>
                </div>
              </div>
              <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Waivers */}
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Waivers</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">0 students</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">₹0</span>
                </div>
              </div>
              <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Collection Calendar (Heatmap Card) ────────────────────── */}
      <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E8F8F5] dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
              Collection calendar
            </h3>
            <p className="text-xs text-slate-400">
              Every day of session 2026-27 · 15 Jun — 02 Oct
            </p>
          </div>
        </div>

        {/* Content: Heatmap on left, Stats on right */}
        <div className="flex flex-col lg:flex-row items-stretch gap-6">
          {/* Heatmap Grid */}
          <div className="flex-1 space-y-2.5 overflow-x-auto pb-2">
            {/* Month labels */}
            <div className="flex text-[11px] font-medium text-slate-400 pl-8 space-x-12 select-none">
              <span>Jul</span>
              <span>Aug</span>
              <span>Sept</span>
              <span>Oct</span>
            </div>

            <div className="flex items-start gap-2">
              {/* Day Labels (Mon, Wed, Fri) */}
              <div className="flex flex-col justify-between h-[120px] text-[10.5px] font-medium text-slate-400 select-none pt-1">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* Heatmap Matrix */}
              <div className="flex gap-1.5">
                {CALENDAR_HEATMAP_DATA.map((col, cIdx) => (
                  <div key={cIdx} className="flex flex-col gap-1.5">
                    {col.map((val, rIdx) => {
                      const isToday = cIdx === 15 && rIdx === 6;
                      const bg =
                        val === 3
                          ? "bg-[#0B3D36] dark:bg-emerald-600"
                          : val === 2
                          ? "bg-[#0D9488]"
                          : val === 1
                          ? "bg-[#80E6D8]"
                          : "bg-[#F3EFE6] dark:bg-slate-800";

                      return (
                        <div
                          key={rIdx}
                          onMouseEnter={() => setHoveredDay(`Day ${cIdx * 7 + rIdx + 1}`)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer ${bg} ${
                            isToday ? "ring-2 ring-slate-900 dark:ring-white" : ""
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap legend footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Hover a day to see its collection</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-[#F3EFE6] dark:bg-slate-800 inline-block" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#80E6D8] inline-block" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0D9488] inline-block" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0B3D36] dark:bg-emerald-600 inline-block" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Right Stats Box */}
          <div className="w-full lg:w-80 bg-[#FAF8F5] dark:bg-slate-900/40 rounded-2xl p-4.5 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">Collected</p>
                <p className="text-lg font-extrabold text-teal-700 dark:text-teal-400 mt-0.5">
                  ₹98,18,750
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Collection days</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  16 of 110
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400 font-medium">Best day</p>
                <p className="text-lg font-extrabold text-teal-700 dark:text-teal-400 mt-0.5">
                  ₹30,64,000
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Longest streak</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  5 days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Two Cards: Collectors & Payment Modes ────────────────── */}
      <div className="fd-two">
        {/* Collectors Card */}
        <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                Collectors
              </h3>
              <p className="text-xs text-slate-400">
                This month · Rajendra A Verma leads with ₹39,000
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {/* Collector 1 */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F5BE47] text-[#0A2E27] font-extrabold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    Rajendra A Verma
                  </p>
                  <p className="text-[11px] text-slate-400">270 receipts · avg ₹36,156</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900 dark:text-white text-sm">₹97,62,200</p>
                <div className="w-20 h-1 bg-teal-600 rounded-full mt-1.5 ml-auto" />
              </div>
            </div>

            {/* Collector 2 */}
            <div className="flex items-center justify-between gap-3 text-xs pt-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    Ashok Kumar Verma
                  </p>
                  <p className="text-[11px] text-slate-400">2 receipts · avg ₹28,275</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900 dark:text-white text-sm">₹56,550</p>
                <div className="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 ml-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modes Card */}
        <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                Payment modes
              </h3>
              <p className="text-xs text-slate-400">
                ₹98,18,750 · 272 payments this session
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Multi-segmented Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: "99.6%" }} className="bg-[#0D9488] h-full" />
              <div style={{ width: "0.4%" }} className="bg-[#7C3AED] h-full" />
            </div>

            {/* List Breakdown */}
            <div className="space-y-2 text-xs">
              {/* Cash */}
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0D9488]" />
                  <strong className="font-semibold text-slate-900 dark:text-white">Cash</strong>
                </span>
                <span className="text-slate-400">271 txns</span>
                <span className="text-slate-400">99.6%</span>
                <span className="font-bold text-slate-900 dark:text-white">₹97,79,750</span>
              </div>

              {/* UPI */}
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED]" />
                  <strong className="font-semibold text-slate-900 dark:text-white">UPI</strong>
                </span>
                <span className="text-slate-400">1 txn</span>
                <span className="text-slate-400">0.4%</span>
                <span className="font-bold text-slate-900 dark:text-white">₹39,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. Live Status Footer ───────────────────────────────────── */}
      <div className="flex items-center justify-center sm:justify-start gap-2 pt-2 text-xs text-slate-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Updated 2 Oct 2026, 03:24 am</span>
        <span>·</span>
        <span>Live — refreshes every minute</span>
      </div>
    </div>
  );
}

export const FeeDashboard = FeeDashboardTab;
