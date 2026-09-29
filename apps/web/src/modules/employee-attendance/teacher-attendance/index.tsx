'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Briefcase } from 'lucide-react';
import {
  StaffAttendanceProps,
  useStaffAttendance,
  AttendanceHeader,
  AttendanceStats,
  AttendanceFooter,
  StaffAttendanceList,
  LiveAttendanceQRModal,
} from './adminStaffAttendance/index';

export function StaffAttendance({ initialTab }: StaffAttendanceProps) {
  const {
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    pendingChanges,
    records,
    filtered,
    stats,
    hasChanges,
    queryLoading,
    isSaving,
    handleStatusChange,
    markAll,
    handleSave,
  } = useStaffAttendance(initialTab);

  const [qrModalOpen, setQrModalOpen] = useState(false);

  return (
    <div className="space-y-6 md:pb-18 pb-26">
      <AttendanceHeader
        activeTab={activeTab}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOpenQR={() => setQrModalOpen(true)}
      />

      <LiveAttendanceQRModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        title={activeTab === 'teacher' ? 'Live Teachers Attendance QR' : 'Live Staff Attendance QR'}
      />

      {/* Tabs shown only when not locked by initialTab (e.g. generic attendance screen) */}
      {!initialTab && (
        <Tabs
          defaultValue="teacher"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl h-12">
            <TabsTrigger
              value="teacher"
              className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm font-bold flex items-center gap-2"
            >
              <GraduationCap className="size-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm font-bold flex items-center gap-2"
            >
              <Briefcase className="size-4" />
              Staff
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <AttendanceStats
        total={stats.total}
        present={stats.present}
        absent={stats.absent}
      />

      <StaffAttendanceList
        activeTab={activeTab}
        recordsCount={records.length}
        filtered={filtered}
        pendingChanges={pendingChanges}
        queryLoading={queryLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMarkAll={markAll}
        onStatusChange={handleStatusChange}
      />

      {!qrModalOpen && (
        <AttendanceFooter
          hasChanges={hasChanges}
          pendingCount={Object.keys(pendingChanges).length}
          activeTab={activeTab}
          isSaving={isSaving}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
