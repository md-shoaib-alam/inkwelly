'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Clock,
  CheckCircle2,
  Check,
  Loader2,
  QrCode,
  LogIn,
  LogOut,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceRecordItem, AttendanceMetrics } from './types';

interface TodayAttendanceCardProps {
  todayRecord: AttendanceRecordItem | null;
  isCheckingIn: boolean;
  onCheckInToggle: () => void;
  onOpenQRScan?: () => void;
  metrics: AttendanceMetrics;
}

export function TodayAttendanceCard({
  todayRecord,
  isCheckingIn,
  onCheckInToggle,
  onOpenQRScan,
  metrics,
}: TodayAttendanceCardProps) {
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const isTodayPresent = todayRecord?.status === 'present';
  const hasCheckedIn = Boolean(todayRecord?.checkIn);
  const hasCheckedOut = Boolean(todayRecord?.checkOut);

  // Current Indian Standard Time (IST) for display in confirmation
  const currentIstTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());

  const handleConfirmCheckOut = () => {
    setShowCheckOutConfirm(false);
    onCheckInToggle();
  };

  return (
    <>
      <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 sm:p-4.5 shadow-2xs space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between pb-0.5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
            Today&apos;s Attendance
          </h3>
          <Badge
            className={cn(
              'font-semibold px-2 py-0.5 text-[11px] sm:text-xs border',
              isTodayPresent
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/80'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200'
            )}
          >
            {isTodayPresent ? '● Present Today' : '● Not Marked'}
          </Badge>
        </div>

        {/* Status Highlight */}
        <div
          className={cn(
            'flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border',
            isTodayPresent
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
              : 'bg-slate-50/90 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800'
          )}
        >
          <div
            className={cn(
              'size-8 sm:size-9 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs',
              isTodayPresent ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-zinc-700'
            )}
          >
            {isTodayPresent ? <Check className="size-4 sm:size-4.5 stroke-[3]" /> : <Clock className="size-4 sm:size-4.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 capitalize">
                {isTodayPresent ? 'Present Today' : 'Not Marked'}
              </h4>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-zinc-400 shrink-0">
                {hasCheckedOut ? 'Shift Completed' : hasCheckedIn ? 'In Progress' : 'Pending'}
              </span>
            </div>
            <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">
              {hasCheckedIn ? 'Attendance active for today' : 'Check-in required for today'}
            </p>
          </div>
        </div>

        {/* Dedicated In Time & Out Time Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {/* In Time Tile */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 shrink-0">
                <LogIn className="size-3 sm:size-3.5 text-emerald-600 dark:text-emerald-400" />
                In Time
              </span>
              <span
                className={cn(
                  'text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0',
                  todayRecord?.checkIn
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-200/70 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                )}
              >
                {todayRecord?.checkIn ? 'Recorded' : 'Pending'}
              </span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
              {todayRecord?.checkIn || '--:--'}
            </p>
          </div>

          {/* Out Time Tile */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 shrink-0">
                <LogOut className="size-3 sm:size-3.5 text-rose-500 dark:text-rose-400" />
                Out Time
              </span>
              <span
                className={cn(
                  'text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0',
                  todayRecord?.checkOut
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                    : todayRecord?.checkIn
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-200/70 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                )}
              >
                {todayRecord?.checkOut ? 'Completed' : todayRecord?.checkIn ? 'In Progress' : 'Pending'}
              </span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
              {todayRecord?.checkOut || '--:--'}
            </p>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="space-y-2 pt-0.5">
          {hasCheckedOut ? (
            /* 1. Fully Completed: In and Out done */
            <Button
              disabled
              className="w-full h-10 sm:h-10.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60 gap-1.5 cursor-not-allowed shadow-none"
            >
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Attendance Completed Today</span>
            </Button>
          ) : hasCheckedIn ? (
            /* 2. Checked In: Allow Check-Out (with confirmation modal). QR is check-in only */
            <div className="space-y-2">
              <Button
                type="button"
                onClick={() => setShowCheckOutConfirm(true)}
                disabled={isCheckingIn}
                className="w-full h-10 sm:h-10.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all gap-1.5 cursor-pointer active:scale-95"
              >
                {isCheckingIn ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Checking out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="size-3.5" />
                    <span>Check Out</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* 3. Not Checked In: Remote manual check-in disabled! Must scan school QR code / enter code */
            <div className="space-y-2">
              <Button
                type="button"
                onClick={onOpenQRScan}
                className="w-full h-10 sm:h-10.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all gap-2 cursor-pointer active:scale-95"
              >
                <QrCode className="size-4" />
                <span>Scan School QR to Check In</span>
              </Button>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-[10.5px] sm:text-[11px] leading-tight">
                <ShieldCheck className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Remote check-in disabled. Scan live QR code or enter kiosk code on campus.</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Check Out Confirmation Dialog */}
      <AlertDialog open={showCheckOutConfirm} onOpenChange={setShowCheckOutConfirm}>
        <AlertDialogContent className="max-w-md rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-zinc-800">
          <AlertDialogHeader className="text-left">
            <div className="size-11 sm:size-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 shadow-2xs">
              <AlertTriangle className="size-6" />
            </div>
            <AlertDialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
              Confirm Daily Check-Out?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 space-y-2.5 pt-1">
              <span>
                Are you sure you want to check out now? Once checked out, your working hours for today will be finalized.
              </span>
              <div className="bg-slate-50 dark:bg-zinc-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Check-in recorded:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {todayRecord?.checkIn || '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Check-out time (IST):</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {currentIstTime}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl h-9 sm:h-10 text-xs sm:text-sm font-semibold cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCheckOut}
              className="rounded-xl h-9 sm:h-10 text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              Yes, Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
