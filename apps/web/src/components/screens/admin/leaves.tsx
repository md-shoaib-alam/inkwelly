'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CalendarDays, Briefcase, Users, Clock, CheckCircle2, XCircle,
  Loader2, FileText, AlertTriangle, Filter, Ban, Plus,
  Search, ArrowRight, RotateCcw, Eye, Check, X,
  Calendar, ArrowUpDown, ChevronDown, Crown, Sparkles
} from 'lucide-react';
import { toast } from "sonner";
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Pagination } from '@/components/shared/pagination';
import { useAppStore } from '@/store/use-app-store';
import { cn } from '@/lib/utils';

// ── Shared Config ──

const statusConfig: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800',
    icon: <Clock className="size-3 mr-1" />,
    label: 'Pending'
  },
  approved: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800',
    icon: <CheckCircle2 className="size-3 mr-1" />,
    label: 'Approved'
  },
  rejected: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-800',
    icon: <XCircle className="size-3 mr-1" />,
    label: 'Rejected'
  },
  cancelled: {
    bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    icon: <Ban className="size-3 mr-1" />,
    label: 'Cancelled'
  },
};

const leaveTypeConfig: Record<string, { bg: string; label: string }> = {
  casual: { bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200/70', label: 'Casual' },
  sick: { bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70', label: 'Sick' },
  earned: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/70', label: 'Earned' },
  maternity: { bg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400 border-pink-200/70', label: 'Maternity' },
  paternity: { bg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/70', label: 'Paternity' },
  duty: { bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200/70', label: 'Duty Leave' },
};

interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  approverRemarks?: string;
  createdAt: string;
}

// Server-side caps for the min/dropdown endpoints used by the applicant picker.
const CANDIDATE_LIMITS: Record<string, number> = { student: 100, teacher: 200, staff: 200 };

function getDurationDays(start: string, end: string): number {
  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  } catch {
    return 1;
  }
}

function formatDateString(d: string | undefined): string {
  if (!d) return '–';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

// ── Main Component ──

export function AdminLeaves({ initialTab = 'teacher' }: { initialTab?: string }) {
  const { currentUser } = useAppStore();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  if (isAdmin) return <AdminManagerView initialTab={initialTab} />;
  return <StaffSelfServiceView />;
}

// ── Admin Manager View ──

function AdminManagerView({ initialTab }: { initialTab: string }) {
  const router = useRouter();
  const { slug } = useParams();
  const activeTab = initialTab;
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  // null = full history (paid plans); a number = rolling month window (basic)
  const [historyMonths, setHistoryMonths] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Filtering is server-side now, so overlapping requests can land out of order.
  // Track the newest one and drop anything stale.
  const fetchSeqRef = useRef(0);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState<'userName' | 'leaveType' | 'startDate' | 'status' | 'createdAt'>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action Dialogs
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    leave: LeaveRequest | null;
    action: 'approve' | 'reject';
    remarks: string;
    loading: boolean;
  }>({
    open: false,
    leave: null,
    action: 'approve',
    remarks: '',
    loading: false,
  });

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    leave: LeaveRequest | null;
  }>({
    open: false,
    leave: null,
  });

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    userId: '',
    leaveType: 'casual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    isSubmitting: false,
  });

  const [availableCandidates, setAvailableCandidates] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [debouncedCandidateSearch, setDebouncedCandidateSearch] = useState('');
  const [candidatesTruncated, setCandidatesTruncated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCandidateSearch(candidateSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [candidateSearch]);

  // 1. Fetch Candidate List for New Leave Request.
  // Searched server-side: the min lists are capped (100 students / 200 teachers
  // and staff), so a "load everything" approach would silently hide people.
  useEffect(() => {
    if (!applyModalOpen) return;
    let cancelled = false;
    const cap = CANDIDATE_LIMITS[activeTab] ?? 100;

    setCandidatesLoading(true);
    const qs = new URLSearchParams({ mode: 'min', limit: String(cap) });
    if (debouncedCandidateSearch) qs.set('search', debouncedCandidateSearch);

    const endpoint =
      activeTab === 'student'
        ? `/api/students?${qs.toString()}`
        : activeTab === 'teacher'
        ? `/api/teachers?${qs.toString()}`
        : `/api/staff?${qs.toString()}`;

    apiFetch(endpoint)
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (cancelled) return;
        const list: any[] = Array.isArray(data) ? data : data?.items || data?.data || [];
        setAvailableCandidates(list.map((c: any) => ({
          id: c.userId || c.id,
          name: c.name || c.userName || 'Unnamed',
          email: c.email || c.userEmail || ''
        })));
        setCandidatesTruncated(list.length >= cap);
      })
      .catch(() => {
        if (!cancelled) setAvailableCandidates([]);
      })
      .finally(() => {
        if (!cancelled) setCandidatesLoading(false);
      });

    return () => { cancelled = true; };
  }, [applyModalOpen, activeTab, debouncedCandidateSearch]);

  // 2. Fetch one page of leaves (search, filters, sort and paging all server-side)
  const fetchLeaves = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        role: activeTab,
        paginate: 'true',
        page: String(currentPage),
        limit: String(pageSize),
        sortBy: sortField,
        order: sortAsc ? 'asc' : 'desc',
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (leaveTypeFilter !== 'all') params.set('leaveType', leaveTypeFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (startDateFilter) params.set('from', startDateFilter);
      if (endDateFilter) params.set('to', endDateFilter);

      const res = await apiFetch(`/api/leaves?${params.toString()}`);
      if (seq !== fetchSeqRef.current) return;
      if (res.ok) {
        const data = await res.json();
        const list: LeaveRequest[] = Array.isArray(data?.items) ? data.items : [];
        const serverTotal = Number(data?.total ?? 0);
        const serverTotalPages = Math.max(1, Number(data?.totalPages ?? 1));

        // The last page can empty out after an approve/reject — step back one
        if (list.length === 0 && serverTotal > 0 && currentPage > serverTotalPages) {
          setCurrentPage(serverTotalPages);
          return;
        }

        setLeaves(list);
        setTotal(serverTotal);
        setTotalPages(serverTotalPages);
        setCounts(data?.counts ?? {});
        setHistoryMonths(typeof data?.historyMonths === 'number' ? data.historyMonths : null);
      }
    } catch {
      /* silent */
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  }, [
    activeTab, statusFilter, leaveTypeFilter, startDateFilter, endDateFilter,
    debouncedSearch, sortField, sortAsc, currentPage, pageSize,
  ]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // 3. Metric cards — totals come from the server (window + filters applied)
  const metrics = useMemo(() => {
    return {
      total: counts.all ?? 0,
      approved: counts.approved ?? 0,
      pending: counts.pending ?? 0,
      rejected: counts.rejected ?? 0,
    };
  }, [counts]);

  const minFromDate = useMemo(() => {
    if (historyMonths === null) return undefined;
    const d = new Date();
    d.setMonth(d.getMonth() - historyMonths);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, [historyMonths]);

  // Handle Sort Toggle
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  // Handle Checkbox Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === leaves.length && leaves.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leaves.map(l => l.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Handle Approve / Reject
  const handleProcessAction = async () => {
    if (!actionDialog.leave) return;
    setActionDialog(p => ({ ...p, loading: true }));
    try {
      const res = await apiFetch('/api/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: actionDialog.leave.id,
          status: actionDialog.action === 'approve' ? 'approved' : 'rejected',
          approverRemarks: actionDialog.remarks.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Action failed');

      toast.success(
        actionDialog.action === 'approve'
          ? 'Leave request approved successfully!'
          : 'Leave request rejected.'
      );
      setActionDialog({ open: false, leave: null, action: 'approve', remarks: '', loading: false });
      await fetchLeaves();
    } catch {
      toast.error('Failed to update leave status');
      setActionDialog(p => ({ ...p, loading: false }));
    }
  };

  // Handle Create Leave Request
  const handleCreateLeave = async () => {
    if (!applyForm.userId) {
      toast.error('Please select an applicant');
      return;
    }
    if (new Date(applyForm.endDate) < new Date(applyForm.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }

    setApplyForm(p => ({ ...p, isSubmitting: true }));
    try {
      const res = await apiFetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: applyForm.userId,
          leaveType: applyForm.leaveType,
          startDate: applyForm.startDate,
          endDate: applyForm.endDate,
          reason: applyForm.reason.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Submission failed');

      toast.success('Leave request created successfully!');
      setApplyModalOpen(false);
      setApplyForm({
        userId: '',
        leaveType: 'casual',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        isSubmitting: false,
      });
      await fetchLeaves();
    } catch {
      toast.error('Failed to create leave request');
      setApplyForm(p => ({ ...p, isSubmitting: false }));
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setLeaveTypeFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
  };

  const roleLabel =
    activeTab === 'student' ? 'students' : activeTab === 'teacher' ? 'teachers' : 'staff members';

  return (
    <div className="space-y-5">
      {/* ── 1. Hero Banner ── */}
      <div className="relative rounded-3xl p-6 sm:p-7 overflow-hidden border border-blue-100/90 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/80 dark:from-blue-950/20 dark:via-zinc-900/60 dark:to-blue-950/20 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 z-10">
          <div className="size-12 rounded-2xl bg-blue-100/90 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 shadow-xs shrink-0">
            <Calendar className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Leave Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Review and manage leave requests from {roleLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 z-10 w-full md:w-auto justify-between md:justify-end">
          <img
            src="/assets/admin/timetable.avif"
            alt="Leave Illustration"
            className="h-24 sm:h-28 object-contain pointer-events-none select-none drop-shadow-xs hidden md:block"
          />
          <Button
            onClick={() => setApplyModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 font-semibold shadow-md shadow-blue-600/25 transition-all gap-2 shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            <span>New Leave Request</span>
          </Button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 size-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ── 2. Metric Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[
          {
            title: 'Total Requests',
            value: metrics.total,
            icon: <Users className="size-4 sm:size-4.5" />,
            iconBox: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
            arrowBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60',
            bottomWave: 'from-blue-100/40 dark:from-blue-950/20 to-transparent',
          },
          {
            title: 'Approved',
            value: metrics.approved,
            icon: <CheckCircle2 className="size-4 sm:size-4.5" />,
            iconBox: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
            arrowBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
            bottomWave: 'from-emerald-100/40 dark:from-emerald-950/20 to-transparent',
          },
          {
            title: 'Pending',
            value: metrics.pending,
            icon: <Clock className="size-4 sm:size-4.5" />,
            iconBox: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
            arrowBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60',
            bottomWave: 'from-amber-100/40 dark:from-amber-950/20 to-transparent',
          },
          {
            title: 'Rejected',
            value: metrics.rejected,
            icon: <XCircle className="size-4 sm:size-4.5" />,
            iconBox: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
            arrowBg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60',
            bottomWave: 'from-rose-100/40 dark:from-rose-950/20 to-transparent',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
          >
            {/* Subtle bottom curved gradient wave */}
            <div
              className={`absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t ${card.bottomWave} pointer-events-none rounded-b-2xl`}
            />

            <div className="relative z-10">
              {/* Top row: Icon, Title & Arrow */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`size-8 sm:size-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${card.iconBox}`}
                  >
                    {card.icon}
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                    {card.title}
                  </span>
                </div>

                <div
                  className={`size-6 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 ${card.arrowBg}`}
                >
                  <ArrowRight className="size-3" />
                </div>
              </div>

              {/* Bottom stat value */}
              <div className="mt-2.5 sm:mt-3 pl-0.5">
                <span className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {card.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Basic plan: history is windowed server-side, so say so and offer the upgrade */}
      {historyMonths !== null && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/10 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-center size-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 shrink-0">
            <Crown className="size-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
              Showing the last {historyMonths} months of leave history
            </p>
            <p className="text-[11px] sm:text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              Your current plan only keeps a rolling {historyMonths}-month window. Upgrade to see every request ever filed.
            </p>
          </div>
          <Button
            onClick={() => router.push(`/${slug}/manage-plan`)}
            className="rounded-xl h-9 px-3.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs shadow-amber-600/20 shrink-0"
          >
            <Sparkles className="size-3.5" />
            <span>Upgrade for full history</span>
          </Button>
        </div>
      )}

      {/* ── 3. Search & Filter Bar ── */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={`Search by ${activeTab === 'student' ? 'student name or reason...' : activeTab === 'teacher' ? 'teacher name or reason...' : 'staff name or reason...'}`}
              className="pl-9 h-10 rounded-xl bg-slate-50/60 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-full sm:w-36">
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50/60 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Dropdown */}
          <div className="w-full sm:w-36">
            <Select value={leaveTypeFilter} onValueChange={v => { setLeaveTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50/60 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Types</SelectItem>
                {Object.keys(leaveTypeConfig).map(k => (
                  <SelectItem key={k} value={k} className="capitalize">
                    {leaveTypeConfig[k]?.label || k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter (Start Date) */}
          <div className="w-full sm:w-40">
            <Input
              type="date"
              value={startDateFilter}
              min={minFromDate}
              onChange={e => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
              placeholder="From Date"
              className="h-10 rounded-xl bg-slate-50/60 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-xs"
            />
          </div>

          {/* Date Filter (End Date) */}
          <div className="w-full sm:w-40">
            <Input
              type="date"
              value={endDateFilter}
              onChange={e => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
              placeholder="To Date"
              className="h-10 rounded-xl bg-slate-50/60 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-xs"
            />
          </div>

          {/* Action Buttons: Reset & Filter */}
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="h-10 px-3.5 rounded-xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-medium gap-1.5 shadow-2xs"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
            <Button
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-600/20 gap-1.5"
              onClick={() => { if (currentPage === 1) fetchLeaves(); else setCurrentPage(1); }}
            >
              <Filter className="size-3.5" />
              <span>Filter</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ── 4. Main Table Card ── */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : leaves.length === 0 ? (
            /* Empty State Matching Screenshot */
            <div className="py-16 sm:py-20 px-4 text-center flex flex-col items-center justify-center animate-in fade-in-50 duration-300">
              <div className="size-20 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
                <FileText className="size-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                No leave requests found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
                There are no leave requests matching your filters.
              </p>
              <Button
                variant="outline"
                onClick={() => setApplyModalOpen(true)}
                className="mt-5 rounded-xl h-10 px-4 text-xs font-semibold border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-2 shadow-2xs"
              >
                <Plus className="size-4" />
                <span>New Leave Request</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/70 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === leaves.length && leaves.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 size-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-xs font-semibold" onClick={() => handleSort('userName')}>
                      <div className="flex items-center gap-1.5">
                        <span>Applicant</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-xs font-semibold" onClick={() => handleSort('leaveType')}>
                      <div className="flex items-center gap-1.5">
                        <span>Type</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-xs font-semibold" onClick={() => handleSort('startDate')}>
                      <div className="flex items-center gap-1.5">
                        <span>Dates</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Reason
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-xs font-semibold text-center" onClick={() => handleSort('status')}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Status</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-xs font-semibold" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center gap-1.5">
                        <span>Applied On</span>
                        <ArrowUpDown className="size-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map(l => {
                    const duration = getDurationDays(l.startDate, l.endDate);
                    const isSelected = selectedIds.has(l.id);
                    const initials = l.userName
                      ?.split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'U';

                    return (
                      <TableRow
                        key={l.id}
                        className={cn(
                          "transition-colors hover:bg-slate-50/70 dark:hover:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/60",
                          isSelected && "bg-blue-50/40 dark:bg-blue-950/20"
                        )}
                      >
                        <TableCell className="px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(l.id)}
                            className="rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 size-4 cursor-pointer"
                          />
                        </TableCell>

                        {/* Applicant Name & Avatar */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8.5 rounded-full border border-slate-200 dark:border-zinc-800">
                              <AvatarFallback className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
                                {l.userName}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                                {l.userEmail || `${l.role}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Type Badge */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium rounded-lg px-2.5 py-0.5 border capitalize",
                              leaveTypeConfig[l.leaveType]?.bg || "bg-slate-100 text-slate-700"
                            )}
                          >
                            {leaveTypeConfig[l.leaveType]?.label || l.leaveType}
                          </Badge>
                        </TableCell>

                        {/* Dates with Day Duration */}
                        <TableCell className="text-xs text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 dark:text-zinc-200">
                              {formatDateString(l.startDate)} - {formatDateString(l.endDate)}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                              {duration} {duration === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Reason */}
                        <TableCell className="text-xs text-slate-500 dark:text-zinc-400 max-w-[200px] truncate" title={l.reason || '–'}>
                          {l.reason || '–'}
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "text-xs font-semibold rounded-lg px-2.5 py-0.5 border shadow-2xs inline-flex items-center",
                              statusConfig[l.status]?.bg || "bg-zinc-100 text-zinc-700"
                            )}
                          >
                            {statusConfig[l.status]?.icon}
                            <span>{statusConfig[l.status]?.label || l.status}</span>
                          </Badge>
                        </TableCell>

                        {/* Applied On */}
                        <TableCell className="text-xs text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                          {formatDateString(l.createdAt)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {l.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setActionDialog({ open: true, leave: l, action: 'approve', remarks: '', loading: false })}
                                  className="size-8 p-0 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                  title="Approve"
                                >
                                  <Check className="size-4" strokeWidth={2.5} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setActionDialog({ open: true, leave: l, action: 'reject', remarks: '', loading: false })}
                                  className="size-8 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  title="Reject"
                                >
                                  <X className="size-4" strokeWidth={2.5} />
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDetailModal({ open: true, leave: l })}
                              className="size-8 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                              title="View Details"
                            >
                              <Eye className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ── 5. Pagination Footer ── */}
          {!loading && leaves.length > 0 && (
            <div className="border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30 px-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                onLimitChange={l => { setPageSize(l); setCurrentPage(1); }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 6. New Leave Request Dialog ── */}
      <Dialog
        open={applyModalOpen}
        onOpenChange={o => {
          setApplyModalOpen(o);
          if (!o) {
            setCandidateSearch('');
            setDebouncedCandidateSearch('');
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="size-5 text-blue-600" />
              New Leave Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Submit a leave application on behalf of a {activeTab}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Applicant Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 capitalize">
                Select {activeTab}
              </label>
              <Input
                value={candidateSearch}
                onChange={e => setCandidateSearch(e.target.value)}
                placeholder={`Search ${roleLabel} by name...`}
                className="h-10 rounded-xl text-sm"
              />
              {candidatesLoading ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <Select value={applyForm.userId} onValueChange={v => setApplyForm(p => ({ ...p, userId: v }))}>
                  <SelectTrigger className="h-10 rounded-xl text-sm">
                    <SelectValue placeholder={`Choose ${activeTab}...`} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56">
                    {availableCandidates.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.email ? `(${c.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!candidatesLoading && availableCandidates.length === 0 && (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  No {roleLabel} found{candidateSearch ? ` for "${candidateSearch}"` : ''}.
                </p>
              )}
              {!candidatesLoading && candidatesTruncated && !candidateSearch && (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Showing the first {CANDIDATE_LIMITS[activeTab] ?? 100} — type a name to narrow down.
                </p>
              )}
            </div>

            {/* Leave Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Leave Type</label>
              <Select value={applyForm.leaveType} onValueChange={v => setApplyForm(p => ({ ...p, leaveType: v }))}>
                <SelectTrigger className="h-10 rounded-xl text-sm capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.keys(leaveTypeConfig).map(k => (
                    <SelectItem key={k} value={k} className="capitalize">
                      {leaveTypeConfig[k]?.label || k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start and End Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Start Date</label>
                <Input
                  type="date"
                  value={applyForm.startDate}
                  onChange={e => {
                    const newStart = e.target.value;
                    const newEnd = applyForm.endDate && applyForm.endDate < newStart ? newStart : applyForm.endDate;
                    setApplyForm(p => ({ ...p, startDate: newStart, endDate: newEnd }));
                  }}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">End Date</label>
                <Input
                  type="date"
                  value={applyForm.endDate}
                  onChange={e => setApplyForm(p => ({ ...p, endDate: e.target.value }))}
                  min={applyForm.startDate}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Reason</label>
              <Textarea
                placeholder="Provide details or reason for leave..."
                value={applyForm.reason}
                onChange={e => setApplyForm(p => ({ ...p, reason: e.target.value }))}
                className="rounded-xl min-h-[80px] text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setApplyModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLeave}
              disabled={applyForm.isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1.5"
            >
              {applyForm.isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Request</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 7. Approve / Reject Action Modal ── */}
      <Dialog open={actionDialog.open} onOpenChange={v => setActionDialog(p => ({ ...p, open: v }))}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {actionDialog.action === 'approve' ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <XCircle className="size-5 text-rose-600" />
              )}
              {actionDialog.action === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm your decision and optionally add remarks for the applicant.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-xs space-y-1">
              <p>
                <strong>Applicant:</strong> {actionDialog.leave?.userName} ({actionDialog.leave?.role})
              </p>
              <p>
                <strong>Duration:</strong> {formatDateString(actionDialog.leave?.startDate)} - {formatDateString(actionDialog.leave?.endDate)}
              </p>
              {actionDialog.leave?.reason && (
                <p>
                  <strong>Reason:</strong> {actionDialog.leave?.reason}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Approver Remarks</label>
              <Textarea
                placeholder="Optional notes or instructions..."
                value={actionDialog.remarks}
                onChange={e => setActionDialog(p => ({ ...p, remarks: e.target.value }))}
                className="rounded-xl min-h-[75px] text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setActionDialog(p => ({ ...p, open: false }))}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={actionDialog.loading}
              onClick={handleProcessAction}
              className={cn(
                "rounded-xl text-xs text-white",
                actionDialog.action === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
              )}
            >
              {actionDialog.loading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Confirm {actionDialog.action === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 8. View Detail Modal ── */}
      <Dialog open={detailModal.open} onOpenChange={v => setDetailModal(p => ({ ...p, open: v }))}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="size-5 text-blue-600" />
              Leave Details
            </DialogTitle>
          </DialogHeader>

          {detailModal.leave && (
            <div className="py-2 space-y-3.5 text-xs text-slate-700 dark:text-zinc-300">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Applicant</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-zinc-100 mt-0.5">{detailModal.leave.userName}</p>
                  <p className="text-[11px] text-slate-400">{detailModal.leave.userEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Status</span>
                  <div className="mt-1">
                    <Badge className={cn("text-xs font-semibold rounded-lg px-2.5 py-0.5", statusConfig[detailModal.leave.status]?.bg)}>
                      {statusConfig[detailModal.leave.status]?.label || detailModal.leave.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Leave Type</span>
                  <p className="font-semibold text-slate-900 dark:text-zinc-100 capitalize mt-0.5">{detailModal.leave.leaveType}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Duration</span>
                  <p className="font-semibold text-slate-900 dark:text-zinc-100 mt-0.5">
                    {getDurationDays(detailModal.leave.startDate, detailModal.leave.endDate)} days
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Dates</span>
                <p className="font-semibold text-slate-800 dark:text-zinc-200">
                  {formatDateString(detailModal.leave.startDate)} to {formatDateString(detailModal.leave.endDate)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Reason</span>
                <p className="text-slate-800 dark:text-zinc-200 leading-relaxed">{detailModal.leave.reason || 'No reason provided.'}</p>
              </div>

              {detailModal.leave.approverRemarks && (
                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold">Approver Remarks</span>
                  <p className="text-slate-800 dark:text-zinc-200 leading-relaxed">{detailModal.leave.approverRemarks}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailModal({ open: false, leave: null })}
              className="rounded-xl text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Staff Self Service View ──

function StaffSelfServiceView() {
  const { currentUser } = useAppStore();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'casual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const currentUserId = currentUser?.id;

  const fetchMyLeaves = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/leaves?userId=${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchMyLeaves();
  }, [fetchMyLeaves]);

  const handleApply = async () => {
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    const promise = (async () => {
      const res = await apiFetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setApplyOpen(false);
      setForm({
        leaveType: 'casual',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
      });
      await fetchMyLeaves();
    })();
    toast.promise(promise, { loading: 'Submitting...', success: 'Submitted successfully', error: 'Failed' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">My Leaves</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">View and apply for your personal leaves</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs gap-2"
          onClick={() => setApplyOpen(true)}
        >
          <Plus className="size-4" /> Apply Leave
        </Button>
      </div>

      <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/70 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/80">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Dates</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-xs italic">
                      No leave history found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map(l => (
                    <TableRow key={l.id} className="border-b border-slate-100 dark:border-zinc-800/60">
                      <TableCell className="capitalize font-medium text-xs">
                        <Badge variant="outline" className={cn("text-xs font-medium rounded-lg px-2.5 py-0.5", leaveTypeConfig[l.leaveType]?.bg)}>
                          {leaveTypeConfig[l.leaveType]?.label || l.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-zinc-300">
                        {formatDateString(l.startDate)} - {formatDateString(l.endDate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-xs font-semibold rounded-lg px-2.5 py-0.5 border shadow-2xs inline-flex items-center", statusConfig[l.status]?.bg)}>
                          {statusConfig[l.status]?.icon}
                          <span>{statusConfig[l.status]?.label || l.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        {l.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium"
                            onClick={async () => {
                              await apiFetch('/api/leaves', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: l.id, status: 'cancelled' }),
                              });
                              fetchMyLeaves();
                            }}
                          >
                            Cancel Request
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Apply Modal */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="size-5 text-blue-600" />
              New Application
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apply for a leave by selecting type, dates, and reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Start Date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => {
                    const newStart = e.target.value;
                    const newEnd = form.endDate && form.endDate < newStart ? newStart : form.endDate;
                    setForm({ ...form, startDate: newStart, endDate: newEnd });
                  }}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">End Date</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  min={form.startDate}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Leave Type</label>
              <Select value={form.leaveType} onValueChange={v => setForm({ ...form, leaveType: v })}>
                <SelectTrigger className="h-10 rounded-xl text-sm capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.keys(leaveTypeConfig).map(k => (
                    <SelectItem key={k} value={k} className="capitalize">
                      {leaveTypeConfig[k]?.label || k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Reason</label>
              <Textarea
                placeholder="Reason for leave..."
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className="rounded-xl min-h-[80px] text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setApplyOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs">
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
