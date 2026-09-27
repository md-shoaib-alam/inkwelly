"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { UserCheck, Search, ChevronRight, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useFeeConcessions, useFeeReceipts } from '@/hooks/use-fees';
import { feeStatusConfig, receiptStatusConfig, paymentMethodIcons } from './config';
import type { StudentOption, ClassOption, FeeItem, FeeReceipt, FeeConcession } from './types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export function FeeStatusTab() {
  const [classFilter, setClassFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedSearch = useDebounce(studentSearch, 500);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  const { 
    data: studentsInfiniteData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: loadingStudents 
  } = useInfiniteQuery({
    queryKey: ['students-infinite', classFilter, debouncedSearch],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: '40',
        ...(classFilter && { classId: classFilter }),
        ...(debouncedSearch && { search: debouncedSearch })
      });
      const res = await apiFetch(`/api/students?${queryParams.toString()}`);
      return res.json();
    },
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage.page);
      const totalPages = Number(lastPage.totalPages);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: !!classFilter
  });

  const students = useMemo(() => 
    studentsInfiniteData?.pages.flatMap(page => page.items) || [], 
    [studentsInfiniteData]
  );

  const observer = useRef<IntersectionObserver | null>(null);
  const lastStudentElementRef = useCallback((node: HTMLButtonElement | null) => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const { data: classes = [] } = useQuery<ClassOption[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await apiFetch('/api/classes?mode=min');
      return res.json();
    }
  });

  const { data: feeData, isLoading: loadingFees } = useQuery<{ items: FeeItem[] }>({
    queryKey: ['fees', selectedStudent?.id],
    enabled: !!selectedStudent,
    queryFn: async () => {
      const res = await apiFetch(`/api/fees?studentId=${selectedStudent?.id}`);
      return res.json();
    }
  });
  const fees = feeData?.items || [];

  const { data: receiptsData, isLoading: loadingReceipts } = useQuery<{ items: FeeReceipt[] }>({
    queryKey: ['fee-receipts', selectedStudent?.id],
    enabled: !!selectedStudent,
    queryFn: async () => {
      const res = await apiFetch(`/api/fee-receipts?studentId=${selectedStudent?.id}`);
      return res.json();
    }
  });
  const receipts = receiptsData?.items || [];

  const { data: concessions = [], isLoading: loadingConcessions } = useFeeConcessions(selectedStudent?.id);

  const loading = loadingFees || loadingReceipts || loadingConcessions;

  const handleSelectStudent = (student: StudentOption) => {
    setSelectedStudent(student);
  };

  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.paidAmount, 0);
  const totalConcessions = fees.reduce((s, f) => s + f.concession, 0);
  const totalPending = fees.filter(f => f.status === 'pending' || f.status === 'overdue' || f.status === 'partially_paid').reduce((s, f) => s + (f.amount - f.concession - f.paidAmount), 0);
  const totalOverdue = fees.filter(f => f.status === 'overdue').reduce((s, f) => s + (f.amount - f.concession - f.paidAmount), 0);
  const payPercentage = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;

  return (
    <div className="space-y-2.5 sm:space-y-4 h-[calc(100dvh-9rem)] lg:h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
      {!selectedStudent ? (
        /* Student Search */
        <Card className="hover:shadow-md transition-shadow flex-1 flex flex-col overflow-hidden border-emerald-500/10 dark:border-emerald-500/5">
          <CardHeader className="shrink-0 pb-2 sm:pb-6">
            <CardTitle className="text-base flex items-center gap-2"><UserCheck className="size-5 text-emerald-600" />Check Fee Status</CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">Search for a student to view their complete fee status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 sm:space-y-4 flex-1 flex flex-col overflow-hidden pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
              <Select value={classFilter} onValueChange={v => { setClassFilter(v); setStudentSearch(''); }}>
                <SelectTrigger className="w-full sm:w-48 h-9"><SelectValue placeholder="Select Class..." /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}-{c.section} (Grade {c.grade})</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Search by name..." className="pl-9 h-9 text-sm" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0 rounded-lg border">
              <div className="divide-y">
                {!classFilter ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-48 select-none">
                    <UserCheck className="size-10 mb-2 text-emerald-600/40" />
                    <p className="font-semibold text-sm text-foreground">Select a Class</p>
                    <p className="text-xs opacity-70 mt-1 max-w-xs mx-auto">Please choose a class from the dropdown menu to view and filter its students list.</p>
                  </div>
                ) : loadingStudents ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-6 animate-spin text-emerald-600" />
                    <p className="text-xs">Fetching class students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-48 select-none">
                    <UserCheck className="size-10 mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No Students Found</p>
                    <p className="text-xs opacity-70 mt-1">There are no students enrolled in this class matching your query.</p>
                  </div>
                ) : (
                  <>
                    {students.map((s, index) => {
                      if (!s) return null;
                      return (
                        <button 
                          key={s.id || index} 
                          ref={index === students.length - 1 ? lastStudentElementRef : null}
                          type="button" 
                          className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors text-left" 
                          onClick={() => handleSelectStudent(s)}
                        >
                        <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-semibold shrink-0">
                          {(s?.name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{s?.name || 'Student'}</p>
                          <p className="text-xs text-muted-foreground">{s?.className || 'Class'} • {s?.phone || 'No phone'}</p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                        </button>
                      );
                    })}
                    {isFetchingNextPage && (
                      <div className="p-4 flex items-center justify-center text-muted-foreground gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-xs font-medium">Loading more students...</span>
                      </div>
                    )}
                    {!hasNextPage && students.length > 0 && (
                      <div className="p-4 text-center text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-50">
                        End of student list
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 overflow-y-auto -mx-4 px-4 scrollbar-hide">
          <div className="space-y-4 pb-8">
            {/* Student Header */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="size-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xl font-bold shrink-0">
                  {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold">{selectedStudent.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.className} • {selectedStudent.phone || 'No phone'}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSelectedStudent(null); }}>Change Student</Button>
              </CardContent>
            </Card>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Total Fees</p>
                      <p className="text-xl font-bold">₹{totalFees.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalPaid.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">₹{totalPending.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Overdue</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">₹{totalOverdue.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Concessions</p>
                      <p className="text-xl font-bold text-violet-600 dark:text-violet-400">₹{totalConcessions.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Fee Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fee Breakdown</CardTitle>
                  <CardDescription>{fees.length} fee item(s)</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {fees.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <DollarSign className="size-10 mx-auto mb-2 opacity-30" /><p>No fee records found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="hidden sm:table-cell">Total</TableHead>
                            <TableHead className="hidden md:table-cell">Concession</TableHead>
                            <TableHead className="hidden md:table-cell">Payable</TableHead>
                            <TableHead className="hidden sm:table-cell">Paid</TableHead>
                            <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fees.map(fee => {
                            const cfg = feeStatusConfig[fee.status] || feeStatusConfig.pending;
                            const payable = fee.amount - fee.concession;
                            return (
                              <TableRow key={fee.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors">
                                <TableCell className="font-medium text-sm">{fee.feeCategoryName || fee.type}</TableCell>
                                <TableCell className="hidden sm:table-cell text-sm">₹{fee.amount.toLocaleString()}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-amber-600">{fee.concession > 0 ? `-₹${fee.concession.toLocaleString()}` : '–'}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm font-medium">₹{payable.toLocaleString()}</TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-emerald-600 font-medium">₹{fee.paidAmount.toLocaleString()}</TableCell>
                                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{fee.dueDate}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`${cfg.bg} font-medium capitalize`}>
                                    {cfg.icon}
                                    <span className="ml-1">{fee.status}</span>
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Payments */}
              {receipts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Payments</CardTitle>
                    <CardDescription>{receipts.length} receipt(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {receipts.slice(0, 5).map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors">
                          <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            {paymentMethodIcons[r.paymentMethod] || <DollarSign className="size-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs font-semibold">{r.receiptNumber}</p>
                            <p className="text-xs text-muted-foreground">{r.paidDate} • {r.paymentMethod}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">₹{r.paidAmount.toLocaleString()}</p>
                            <Badge variant="outline" className={`${(receiptStatusConfig[r.status] || receiptStatusConfig.completed).bg} border-0 text-xs capitalize`}>{r.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
