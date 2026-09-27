'use client';

import React from 'react';
import { Calendar as CalendarIcon, CalendarCheck, History as HistoryIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  useMyAttendance,
  MonthlyMetricCards,
  AttendanceCalendar,
  TodayAttendanceCard,
  AttendanceBreakdownCard,
  RecentAttendanceList,
  AttendanceHistoryDialog,
  TeacherQRScanModal,
} from './my-attendance/index';

type MobileView = 'today' | 'calendar' | 'history';

export function TeacherMyAttendance() {
  const {
    todayStr,
    currentRealYear,
    currentRealMonth,
    calYear,
    calMonth,
    selectedDate,
    setSelectedDate,
    currentMonthRecords,
    calendarRecords,
    currentMonthMetrics,
    todayRecord,
    recentRecords,
    isCheckingIn,
    viewAllModalOpen,
    setViewAllModalOpen,
    handlePrevMonth,
    handleNextMonth,
    handleGoToday,
    handleCheckInToggle,
    refetch,
  } = useMyAttendance();

  const [qrScanModalOpen, setQrScanModalOpen] = React.useState(false);
  const [mobileView, setMobileView] = React.useState<MobileView>('today');

  const showOnly = (...views: MobileView[]) =>
    views.includes(mobileView) ? '' : 'max-lg:hidden';

  return (
    <div className="space-y-5">
      {/* ── 1. Page Title ── */}
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
        My <span className="text-blue-600 dark:text-blue-400">Attendance</span>
      </h2>

      {/* ── 2. Mobile Only: Today / Calendar / History Switcher ── */}
      <Tabs
        value={mobileView}
        onValueChange={(v) => setMobileView(v as MobileView)}
        className="lg:hidden"
      >
        <TabsList className="w-full">
          <TabsTrigger value="today" className="gap-1.5">
            <CalendarCheck className="size-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarIcon className="size-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <HistoryIcon className="size-4" />
            History
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── 3. Five Current Month Summary Metric Cards ── */}
      <MonthlyMetricCards
        metrics={currentMonthMetrics}
        currentRealMonth={currentRealMonth}
        currentRealYear={currentRealYear}
        className={showOnly('calendar')}
      />

      {/* ── 4. Three-Column Main Dashboard Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left Column: Interactive Month Calendar (5 cols) ── */}
        <AttendanceCalendar
          calYear={calYear}
          calMonth={calMonth}
          todayStr={todayStr}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onGoToday={handleGoToday}
          calendarRecords={calendarRecords}
          className={showOnly('calendar')}
        />

        {/* ── Middle Column: Today's Attendance & Breakdown (4 cols) ── */}
        <div className={cn('grid gap-3 lg:col-span-4 lg:block lg:space-y-4', showOnly('today'))}>
          <TodayAttendanceCard
            todayRecord={todayRecord}
            isCheckingIn={isCheckingIn}
            onCheckInToggle={handleCheckInToggle}
            onOpenQRScan={() => setQrScanModalOpen(true)}
            metrics={currentMonthMetrics}
          />

          <AttendanceBreakdownCard metrics={currentMonthMetrics} />
        </div>

        {/* ── Right Column: Recent Attendance Log (3 cols) ── */}
        <RecentAttendanceList
          recentRecords={recentRecords}
          currentRealMonth={currentRealMonth}
          currentRealYear={currentRealYear}
          onSelectDate={setSelectedDate}
          onOpenViewAll={() => setViewAllModalOpen(true)}
          className={showOnly('history')}
        />
      </div>

      {/* ── View All Attendance Modal ── */}
      <AttendanceHistoryDialog
        open={viewAllModalOpen}
        onOpenChange={setViewAllModalOpen}
        currentRealMonth={currentRealMonth}
        currentRealYear={currentRealYear}
        currentMonthRecords={currentMonthRecords}
      />

      {/* ── Camera & Code QR Scanner Modal ── */}
      <TeacherQRScanModal
        open={qrScanModalOpen}
        onOpenChange={setQrScanModalOpen}
        onScanSuccess={refetch}
        todayStr={todayStr}
      />
    </div>
  );
}
