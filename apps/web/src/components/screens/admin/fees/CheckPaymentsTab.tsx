"use client";

import { useReducer, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Search, CircleDollarSign, TrendingUp, Percent, DollarSign, Eye, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useFeeReceipts } from '@/hooks/use-fees';
import { paymentMethodConfig, receiptStatusConfig } from './config';
import type { FeeReceipt } from './types';

type State = {
  search: string;
  methodFilter: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  viewDialogOpen: boolean;
  selectedPayment: FeeReceipt | null;
};

type Action =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_METHOD_FILTER'; payload: string }
  | { type: 'SET_DATE_FILTER'; payload: string }
  | { type: 'SET_FROM_DATE'; payload: string }
  | { type: 'SET_TO_DATE'; payload: string }
  | { type: 'OPEN_VIEW'; payload: FeeReceipt }
  | { type: 'CLOSE_VIEW' };

const initialState: State = {
  search: '',
  methodFilter: 'all',
  dateFilter: 'today',
  fromDate: '',
  toDate: '',
  viewDialogOpen: false,
  selectedPayment: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_METHOD_FILTER':
      return { ...state, methodFilter: action.payload };
    case 'SET_DATE_FILTER':
      return { 
        ...state, 
        dateFilter: action.payload, 
        fromDate: action.payload !== 'custom' ? '' : state.fromDate,
        toDate: action.payload !== 'custom' ? '' : state.toDate 
      };
    case 'SET_FROM_DATE':
      return { ...state, fromDate: action.payload };
    case 'SET_TO_DATE':
      return { ...state, toDate: action.payload };
    case 'OPEN_VIEW':
      return { ...state, selectedPayment: action.payload, viewDialogOpen: true };
    case 'CLOSE_VIEW':
      return { ...state, viewDialogOpen: false };
    default:
      return state;
  }
}

export function CheckPaymentsTab() {
  const { data, isLoading: loading } = useFeeReceipts();
  const payments = data?.items || [];
  
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false);
  const [isToCalendarOpen, setIsToCalendarOpen] = useState(false);

  const {
    search,
    methodFilter,
    dateFilter,
    fromDate,
    toDate,
    viewDialogOpen,
    selectedPayment,
  } = state;

  const filtered = useMemo(() => {
    if (!Array.isArray(payments)) return [];
    return payments.filter(p => {
      const matchSearch = search === '' || p.studentName.toLowerCase().includes(search.toLowerCase()) || p.receiptNumber.toLowerCase().includes(search.toLowerCase());
      const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
      const matchDateRange = (fromDate === '' || p.paidDate >= fromDate) && (toDate === '' || p.paidDate <= toDate);
      let matchDatePreset = true;
      
      const getLocalDateString = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const todayStr = getLocalDateString(new Date());

      if (dateFilter === 'today') {
        // Compare with local date format string (YYYY-MM-DD)
        matchDatePreset = p.paidDate.slice(0, 10) === todayStr;
      } else if (dateFilter === 'week') {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = getLocalDateString(weekAgo);
        matchDatePreset = p.paidDate.slice(0, 10) >= weekAgoStr;
      } else if (dateFilter === 'month') {
        const today = new Date();
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthAgoStr = getLocalDateString(monthAgo);
        matchDatePreset = p.paidDate.slice(0, 10) >= monthAgoStr;
      }
      return matchSearch && matchMethod && matchDateRange && matchDatePreset;
    });
  }, [payments, search, methodFilter, dateFilter, fromDate, toDate]);

  const totalPaid = filtered.reduce((s, p) => s + p.paidAmount, 0);
  const totalConcessions = filtered.reduce((s, p) => s + p.concessionTotal, 0);
  const totalOriginal = filtered.reduce((s, p) => s + p.totalAmount, 0);
  const avgPayment = filtered.length > 0 ? totalPaid / filtered.length : 0;

  const methodDistribution = useMemo(() => {
    const dist: Record<string, { count: number; total: number }> = {};
    filtered.forEach(p => {
      if (!dist[p.paymentMethod]) dist[p.paymentMethod] = { count: 0, total: 0 };
      dist[p.paymentMethod].count++;
      dist[p.paymentMethod].total += p.paidAmount;
    });
    return dist;
  }, [filtered]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const dailyTotals = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    filtered.forEach(p => {
      const existing = map.get(p.paidDate) || { count: 0, total: 0 };
      existing.count++;
      existing.total += p.paidAmount;
      map.set(p.paidDate, existing);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a)).slice(0, 10);
  }, [filtered]);

  const summaryCards = [
    { 
      label: 'Total Payments', 
      amount: totalPaid, 
      icon: <CircleDollarSign className="size-4" />, 
      color: 'emerald',
      subtext: `${filtered.length} transactions`
    },
    { 
      label: 'Total Original', 
      amount: totalOriginal, 
      icon: <DollarSign className="size-4" />, 
      color: 'amber',
      subtext: 'Before concessions'
    },
    { 
      label: 'Concessions Given', 
      amount: totalConcessions, 
      icon: <Percent className="size-4" />, 
      color: 'violet',
      subtext: 'Total discounts'
    },
    { 
      label: 'Avg. Payment', 
      amount: avgPayment, 
      icon: <TrendingUp className="size-4" />, 
      color: 'blue',
      subtext: 'Average per txn'
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'emerald',
    amber: 'amber',
    violet: 'violet',
    blue: 'blue'
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </Card>
          <div className="lg:col-span-3 flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:pb-0">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="min-w-[240px] sm:min-w-0 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Card (Total Payments) */}
          {summaryCards.slice(0, 1).map(card => {
            const cls = {
              gradient: 'to-emerald-50/10 dark:to-emerald-950/5',
              hover: 'hover:border-emerald-500/30 dark:hover:border-emerald-500/20',
              bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
              iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
              iconText: 'text-emerald-600 dark:text-emerald-400',
              dot: 'bg-emerald-500'
            };
            return (
              <Card key={card.label} className={`relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-linear-to-br from-white ${cls.gradient} dark:from-zinc-950 p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${cls.hover} transition-all duration-300 group`}>
                <div className={`absolute top-0 right-0 w-20 h-20 ${cls.bg} rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300`} />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider block">{card.label}</span>
                    <div className={`p-2 rounded-lg ${cls.iconBg} ${cls.iconText}`}>
                      {card.icon}
                    </div>
                  </div>
                  <span className={`text-2xl font-extrabold block tracking-tight ${cls.iconText}`}>
                    ₹{Math.round(card.amount).toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-4 flex items-center gap-1.5 font-medium border-t pt-2 border-zinc-100 dark:border-zinc-900">
                  <span className={`inline-block size-1.5 rounded-full ${cls.dot} animate-pulse`} />
                  {card.subtext}
                </div>
              </Card>
            );
          })}

          {/* Other Cards Row - Scrollable on mobile */}
          <div className="lg:col-span-3 flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:pb-0 scrollbar-hide">
            {summaryCards.slice(1).map(card => {
              const colorClasses: Record<string, any> = {
                amber: {
                  gradient: 'to-amber-50/10 dark:to-amber-950/5',
                  hover: 'hover:border-amber-500/30 dark:hover:border-amber-500/20',
                  bg: 'bg-amber-500/5 dark:bg-amber-500/10',
                  iconBg: 'bg-amber-50 dark:bg-amber-950/50',
                  iconText: 'text-amber-600 dark:text-amber-400',
                  dot: 'bg-amber-500'
                },
                violet: {
                  gradient: 'to-violet-50/10 dark:to-violet-950/5',
                  hover: 'hover:border-violet-500/30 dark:hover:border-violet-500/20',
                  bg: 'bg-violet-500/5 dark:bg-violet-500/10',
                  iconBg: 'bg-violet-50 dark:bg-violet-950/50',
                  iconText: 'text-violet-600 dark:text-violet-400',
                  dot: 'bg-violet-500'
                },
                blue: {
                  gradient: 'to-blue-50/10 dark:to-blue-950/5',
                  hover: 'hover:border-blue-500/30 dark:hover:border-blue-500/20',
                  bg: 'bg-blue-500/5 dark:bg-blue-500/10',
                  iconBg: 'bg-blue-50 dark:bg-blue-950/50',
                  iconText: 'text-blue-600 dark:text-blue-400',
                  dot: 'bg-blue-500'
                }
              };
              const cls = colorClasses[card.color as keyof typeof colorClasses] || colorClasses.amber;

              return (
                <Card key={card.label} className={`min-w-[240px] sm:min-w-0 relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-linear-to-br from-white ${cls.gradient} dark:from-zinc-950 p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${cls.hover} transition-all duration-300 group`}>
                  <div className={`absolute top-0 right-0 w-20 h-20 ${cls.bg} rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300`} />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider block">{card.label}</span>
                      <div className={`p-2 rounded-lg ${cls.iconBg} ${cls.iconText}`}>
                        {card.icon}
                      </div>
                    </div>
                    <span className={`text-2xl font-extrabold block tracking-tight text-zinc-900 dark:text-zinc-50`}>
                      ₹{Math.round(card.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-4 flex items-center gap-1.5 font-medium border-t pt-2 border-zinc-100 dark:border-zinc-900">
                    <span className={`inline-block size-1.5 rounded-full ${cls.dot}`} />
                    {card.subtext}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Method Distribution */}
      {Object.keys(methodDistribution).length > 0 && (
        <Card className="border-none shadow-sm bg-zinc-50/50 dark:bg-zinc-900/20">
          <CardHeader className="pb-1 sm:pb-4">
            <CardTitle className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Payment Method Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 sm:pt-6">
            <div className="flex overflow-x-auto gap-2.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:pb-0 scrollbar-hide">
              {Object.entries(methodDistribution).map(([method, data]) => {
                const cfg = paymentMethodConfig[method] || paymentMethodConfig.cash;
                return (
                  <div key={method} className="min-w-[160px] sm:min-w-0 group flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950/50 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 hover:shadow-sm transition-all duration-300">
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 capitalize">{method}</p>
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                        {data.count} <span className="text-[9px] opacity-70 mx-0.5">×</span> ₹{data.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center flex-wrap">
        <div className="relative w-full lg:flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, or receipt #..." className="pl-9 h-9 text-sm" value={search} onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })} />
        </div>
        <div className="flex flex-row gap-2 w-full lg:w-auto">
          <Select value={methodFilter} onValueChange={(v) => dispatch({ type: 'SET_METHOD_FILTER', payload: v })}>
            <SelectTrigger className="flex-1 lg:w-40 h-9 text-xs"><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={v => dispatch({ type: 'SET_DATE_FILTER', payload: v })}>
            <SelectTrigger className="flex-1 lg:w-36 h-9 text-xs"><SelectValue placeholder="Period" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {dateFilter === 'custom' && (
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <Popover open={isFromCalendarOpen} onOpenChange={setIsFromCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 sm:w-44 justify-start text-left font-normal bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{fromDate ? format(new Date(fromDate), "PPP") : "From"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate ? new Date(fromDate) : undefined}
                  onSelect={(date) => {
                    dispatch({ type: 'SET_FROM_DATE', payload: date ? format(date, "yyyy-MM-dd") : '' });
                    setIsFromCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover open={isToCalendarOpen} onOpenChange={setIsToCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 sm:w-44 justify-start text-left font-normal bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{toDate ? format(new Date(toDate), "PPP") : "To"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate ? new Date(toDate) : undefined}
                  onSelect={(date) => {
                    dispatch({ type: 'SET_TO_DATE', payload: date ? format(date, "yyyy-MM-dd") : '' });
                    setIsToCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Transactions</CardTitle>
          <CardDescription>{filtered.length} payment{filtered.length !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CircleDollarSign className="size-10 mb-2 opacity-30" />
              <p className="text-sm">No payments found</p>
              <p className="text-xs mt-1">Payments will appear here once fees are collected</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">Receipt #</TableHead>
                    <TableHead className="pl-4 sm:pl-4">Student</TableHead>
                    <TableHead className="hidden sm:table-cell">Method</TableHead>
                    <TableHead className="hidden sm:table-cell">Original</TableHead>
                    <TableHead className="hidden sm:table-cell">Concession</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden sm:table-cell w-24 text-center">Status</TableHead>
                    <TableHead className="w-16 text-center">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => {
                    const cfg = paymentMethodConfig[p.paymentMethod] || paymentMethodConfig.cash;
                    const stCfg = receiptStatusConfig[p.status] || receiptStatusConfig.completed;
                    return (
                      <TableRow key={p.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors">
                        <TableCell className="hidden sm:table-cell">
                          <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">{p.receiptNumber}</span>
                        </TableCell>
                        <TableCell className="pl-4 sm:pl-4">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-semibold shrink-0">
                              {p.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{p.studentName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium capitalize ${cfg.color}`}>{cfg.icon}{p.paymentMethod}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">₹{p.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-amber-600 dark:text-amber-400">{p.concessionTotal > 0 ? `-₹${p.concessionTotal.toLocaleString()}` : '–'}</TableCell>
                        <TableCell><span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">₹{p.paidAmount.toLocaleString()}</span></TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.paidDate}</TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          <Badge variant="outline" className={`${stCfg.bg} border-0 font-medium capitalize text-xs`}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="size-7 text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50" onClick={() => dispatch({ type: 'OPEN_VIEW', payload: p })}>
                            <Eye className="size-3.5" />
                          </Button>
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

      {/* View Payment Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_VIEW' })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="size-5 text-emerald-600" />
              Payment Details
            </DialogTitle>
            <DialogDescription>{selectedPayment?.receiptNumber}</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                  {selectedPayment.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{selectedPayment.studentName}</p>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl border bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Amount</span>
                  <span className="font-medium">₹{selectedPayment.totalAmount.toLocaleString()}</span>
                </div>
                {selectedPayment.concessionTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Concession</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">-₹{selectedPayment.concessionTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-base font-bold">
                  <span>Amount Paid</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{selectedPayment.paidAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                  <div className="flex items-center gap-1.5 capitalize text-sm font-medium">
                    {(paymentMethodConfig[selectedPayment.paymentMethod] || paymentMethodConfig.cash).icon}
                    {selectedPayment.paymentMethod}
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Payment Date</p>
                  <p className="text-sm font-medium">{selectedPayment.paidDate}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant="outline" className={`${(receiptStatusConfig[selectedPayment.status] || receiptStatusConfig.completed).bg} border-0 capitalize`}>{selectedPayment.status}</Badge>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Fee Items</p>
                  <p className="text-sm font-medium">{selectedPayment.feeItems?.length || 0} item(s)</p>
                </div>
              </div>

              {selectedPayment.feeItems && selectedPayment.feeItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Fee Items</p>
                  <div className="divide-y rounded-lg border overflow-hidden">
                    {selectedPayment.feeItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="size-5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                          <span className="font-medium">{item.feeCategoryName || item.type}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{item.paidAmount.toLocaleString()}</span>
                          {item.concession > 0 && <span className="text-xs text-amber-500 ml-1">(-₹{item.concession.toLocaleString()})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPayment.remarks && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Remarks</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{selectedPayment.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
