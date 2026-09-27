'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarDays, Clock, CheckCircle2, XCircle, AlertTriangle, Ban, Plus, Loader2,
} from 'lucide-react';
import { toast } from "sonner";
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/use-app-store';
import { format } from 'date-fns';

// ── Status Config ──

const statusConfig: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: <Clock className="size-3.5" />, label: 'Pending' },
  approved: { bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: <CheckCircle2 className="size-3.5" />, label: 'Approved' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', icon: <XCircle className="size-3.5" />, label: 'Rejected' },
  cancelled: { bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700', icon: <Ban className="size-3.5" />, label: 'Cancelled' },
};

const leaveTypeConfig: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
  casual: { bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: <CalendarDays className="size-3.5" />, label: 'Casual' },
  sick: { bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', icon: <AlertTriangle className="size-3.5" />, label: 'Sick' },
  earned: { bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: <CheckCircle2 className="size-3.5" />, label: 'Earned' },
  maternity: { bg: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800', icon: <CalendarDays className="size-3.5" />, label: 'Maternity' },
  paternity: { bg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800', icon: <CalendarDays className="size-3.5" />, label: 'Paternity' },
  duty: { bg: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800', icon: <CalendarDays className="size-3.5" />, label: 'Duty Leave' },
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

// ── Main Component ──

export function TeacherLeaves() {
  const { currentUser } = useAppStore();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [form, setForm] = useState({ 
    leaveType: 'casual', 
    startDate: new Date(), 
    endDate: new Date(), 
    reason: '' 
  });
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = currentUser?.id;

  const fetchMyLeaves = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/leaves?userId=${currentUserId}`);
      if (res.ok) {
        setLeaves(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchMyLeaves();
  }, [fetchMyLeaves]);

  const handleApply = async () => {
    if (!form.startDate || !form.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (form.startDate > form.endDate) {
      toast.error('End date must be after start date');
      return;
    }

    setSubmitting(true);
    const promise = (async () => {
      const res = await apiFetch('/api/leaves', {
        method: 'POST',
        body: JSON.stringify({
          leaveType: form.leaveType,
          startDate: format(form.startDate, 'yyyy-MM-dd'),
          endDate: format(form.endDate, 'yyyy-MM-dd'),
          reason: form.reason,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit leave request');
      }
      setApplyOpen(false);
      setForm({
        leaveType: 'casual',
        startDate: new Date(),
        endDate: new Date(),
        reason: '',
      });
      await fetchMyLeaves();
    })();

    toast.promise(promise, {
      loading: 'Submitting leave request...',
      success: 'Leave request submitted successfully',
      error: (err: any) => err.message || 'Failed to submit leave request',
    });

    promise.finally(() => setSubmitting(false));
  };

  const handleCancel = async (leaveId: string) => {
    const promise = (async () => {
      const res = await apiFetch('/api/leaves', {
        method: 'PUT',
        body: JSON.stringify({ id: leaveId, status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Failed to cancel leave');
      await fetchMyLeaves();
    })();

    toast.promise(promise, {
      loading: 'Cancelling leave...',
      success: 'Leave cancelled successfully',
      error: 'Failed to cancel leave',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CalendarDays className="size-6 text-primary" />
            My Leaves
          </h2>
          <p className="text-muted-foreground text-sm mt-1">View and manage your leave requests</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setApplyOpen(true)}>
          <Plus className="size-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {/* Leaves Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {/* Mobile View (Stacked Cards) */}
              <div className="block md:hidden p-4 space-y-4">
                {leaves.length === 0 ? (
                  <div className="text-center py-10 opacity-50 italic text-sm">
                    No leave requests yet
                  </div>
                ) : (
                  leaves.map((leave) => (
                    <div key={leave.id} className="border rounded-lg p-4 bg-card shadow-sm space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <Badge variant="outline" className={leaveTypeConfig[leave.leaveType]?.bg}>
                          {leaveTypeConfig[leave.leaveType]?.label || leave.leaveType}
                        </Badge>
                        <Badge className={statusConfig[leave.status]?.bg}>
                          {statusConfig[leave.status]?.label || leave.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 py-1">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Start Date</span>
                          <p className="text-sm font-semibold">{leave.startDate}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">End Date</span>
                          <p className="text-sm font-semibold">{leave.endDate}</p>
                        </div>
                      </div>

                      <div className="space-y-1 bg-muted/30 p-2 rounded text-sm">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">Reason</span>
                        <p className="text-foreground/90 leading-relaxed italic">
                          {leave.reason || '-'}
                        </p>
                      </div>

                      {leave.status === 'pending' && (
                        <div className="pt-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full h-9 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleCancel(leave.id)}
                          >
                            Cancel Leave
                          </Button>
                        </div>
                      )}
                      {leave.status === 'rejected' && leave.approverRemarks && (
                        <div className="pt-2 border-t text-xs text-amber-600 dark:text-amber-500 italic">
                          Remarks: {leave.approverRemarks}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View (Full Table) */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 opacity-50 italic">
                          No leave requests yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="pl-6">
                            <Badge variant="outline" className={leaveTypeConfig[leave.leaveType]?.bg}>
                              {leaveTypeConfig[leave.leaveType]?.label || leave.leaveType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{leave.startDate}</TableCell>
                          <TableCell className="text-sm">{leave.endDate}</TableCell>
                          <TableCell className="text-sm truncate max-w-[200px]">
                            {leave.reason || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusConfig[leave.status]?.bg}>
                              {statusConfig[leave.status]?.label || leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center pr-6">
                            {leave.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => handleCancel(leave.id)}
                              >
                                Cancel
                              </Button>
                            )}
                            {leave.status === 'rejected' && leave.approverRemarks && (
                              <div className="text-xs text-zinc-500 max-w-[150px] mx-auto text-center">
                                Remarks: {leave.approverRemarks}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              Submit a new leave request. Your request will be reviewed by the administration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Leave Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Leave Type</label>
              <Select value={form.leaveType} onValueChange={(v) => setForm({ ...form, leaveType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leaveTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="capitalize">
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      suppressHydrationWarning
                    >
                      <CalendarDays className="mr-2 size-4" />
                      {form.startDate ? format(form.startDate, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.startDate}
                      onSelect={(date) => {
                        if (date) setForm({ ...form, startDate: date });
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      suppressHydrationWarning
                    >
                      <CalendarDays className="mr-2 size-4" />
                      {form.endDate ? format(form.endDate, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.endDate}
                      onSelect={(date) => {
                        if (date) setForm({ ...form, endDate: date });
                      }}
                      disabled={(date) => date < form.startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                placeholder="Provide a reason for your leave request..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApply}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
