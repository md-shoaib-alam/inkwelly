import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { TeacherWelcomeBanner } from './teacherDashboardComponents/TeacherWelcomeBanner';
import { TeacherStats } from './teacherDashboardComponents/TeacherStats';
import { TodaySchedule } from './teacherDashboardComponents/TodaySchedule';
import { QuickActions } from './teacherDashboardComponents/QuickActions';
import { TeacherSubjects } from './teacherDashboardComponents/TeacherSubjects';
import { RecentAssignments } from './teacherDashboardComponents/RecentAssignments';
import { RecentNotices } from '@/modules/dashboard/components/RecentNotices';
import { TeacherQRScanModal } from '../../attendance/components/TeacherQRScanModal';
import type { AppUser, DashboardData, TeacherDashboardData } from '@/types/index';

interface TeacherDashboardProps {
  user: AppUser;
  data: (DashboardData & TeacherDashboardData) | null;
  refreshing: boolean;
  onRefresh: () => void;
}

const SELF_ATTENDANCE_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  leave: 'Leave',
  holiday: 'Holiday',
  half_day: 'Half day',
  not_marked: 'Not marked',
};

export function TeacherDashboard({
  user,
  data,
  refreshing,
  onRefresh,
}: TeacherDashboardProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();

  const [qrModalVisible, setQrModalVisible] = useState(false);

  const handleNavigate = (route: string) => {
    try {
      router.push(route as any);
    } catch (e) {
      console.warn('Navigation error:', e);
    }
  };

  const totalClasses =
    data?.classes?.length !== undefined
      ? data.classes.length
      : data?.totalClasses ?? 0;

  const totalStudents = data?.totalStudents ?? 0;
  const pendingAssignments = data?.pendingAssignments ?? 0;

  // The teacher's own attendance for today, not their class's student attendance rate.
  const todayAttendanceLabel =
    SELF_ATTENDANCE_LABELS[data?.todaySelfAttendance?.status ?? 'not_marked'] ?? 'Not marked';

  const schedule = data?.todaySchedule || [];
  const subjects = data?.subjects || [];
  const assignments = data?.recentAssignments || [];
  const notices = (data?.recentNotices || []).map((n: any) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    date: n.date || (n.createdAt ? n.createdAt.split('T')[0] : ''),
  }));

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* 1. Welcome Banner */}
        <TeacherWelcomeBanner
          userName={user?.name || 'Teacher'}
          onOpenQRScan={() => setQrModalVisible(true)}
        />

        {/* 2. 4 Stat Cards */}
        <TeacherStats
          totalClasses={totalClasses}
          totalStudents={totalStudents}
          pendingAssignments={pendingAssignments}
          todayAttendanceLabel={todayAttendanceLabel}
          onNavigate={handleNavigate}
        />

        {/* 3. Today's Schedule */}
        <TodaySchedule
          schedule={schedule}
          onNavigate={handleNavigate}
        />

        {/* 4. Quick Actions Grid */}
        <QuickActions
          onNavigate={handleNavigate}
          onOpenQRScan={() => setQrModalVisible(true)}
        />

        {/* 5. My Subjects */}
        <TeacherSubjects
          subjects={subjects}
          onNavigate={handleNavigate}
        />

        {/* 6. Recent Homework */}
        <RecentAssignments
          assignments={assignments}
          onViewAll={() => handleNavigate('/(teacher)/(tabs)/homework')}
        />

        {/* 7. Recent Notices */}
        {notices.length > 0 && (
          <View style={styles.noticesWrap}>
            <RecentNotices data={notices} />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* In-Dashboard QR Attendance Scanner Modal */}
      <TeacherQRScanModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        onScanned={() => {
          setQrModalVisible(false);
          onRefresh();
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  noticesWrap: {
    marginTop: 4,
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 32,
  },
});
