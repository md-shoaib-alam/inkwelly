'use client';

import React, { useState } from 'react';
import { TeacherWelcomeBanner } from '../dashboard_components/TeacherWelcomeBanner';
import { TeacherStats } from '../dashboard_components/TeacherStats';
import { TodaySchedule } from '../dashboard_components/TodaySchedule';
import { QuickActions } from '../dashboard_components/QuickActions';
import { TeacherSubjects } from '../dashboard_components/TeacherSubjects';
import { RecentAssignments } from '../dashboard_components/RecentAssignments';
import { TeacherQRScanModal } from '../my-attendance/TeacherQRScanModal';

interface ComprehensiveDashboardProps {
  classes: any[];
  subjects: any[];
  totalStudents: number;
  pendingAssignments: number;
  todaySchedule: any[];
  todayAttendanceLabel: string;
  assignments: any[];
  currentUser: any;
  formatTime: (time: string) => string;
  formatDate: (dateStr: string) => string;
  navigateTo: (screen: string) => void;
}

export function ComprehensiveDashboard({
  classes,
  subjects,
  totalStudents,
  pendingAssignments,
  todaySchedule,
  todayAttendanceLabel,
  assignments,
  currentUser,
  formatTime,
  formatDate,
  navigateTo,
}: ComprehensiveDashboardProps) {
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Today in Indian Standard Time (IST - Asia/Kolkata)
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Welcome Banner */}
      <TeacherWelcomeBanner
        userName={currentUser?.name || 'Teacher 3'}
        onOpenQRScan={() => setQrModalOpen(true)}
      />

      {/* 2. 4 Stat Cards */}
      <TeacherStats
        totalClasses={classes.length}
        totalStudents={totalStudents}
        pendingAssignments={pendingAssignments}
        todayAttendanceLabel={todayAttendanceLabel}
        onNavigate={navigateTo}
      />

      {/* 3. Middle Section: Today's Schedule (approx 60%) & Quick Actions (approx 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <TodaySchedule
            schedule={todaySchedule}
            formatTime={formatTime}
            onNavigate={navigateTo}
          />
        </div>
        <div className="lg:col-span-2">
          <QuickActions
            onNavigate={navigateTo}
            onOpenQRScan={() => setQrModalOpen(true)}
          />
        </div>
      </div>

      {/* 4. Bottom Section: My Subjects (50%) & Recent Homework (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeacherSubjects subjects={subjects} onNavigate={navigateTo} />
        <RecentAssignments
          assignments={assignments}
          onViewAll={() => navigateTo('homework')}
          formatDate={formatDate}
        />
      </div>

      {/* Direct In-Dashboard QR Attendance Scanner */}
      <TeacherQRScanModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        todayStr={todayStr}
      />
    </div>
  );
}
