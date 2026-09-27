import React from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { SubscriptionAlert } from './SubscriptionAlert';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { MetricStats } from './MetricStats';
import { DashboardCharts } from './DashboardCharts';
import { RecentNotices } from '@/components/dashboard/RecentNotices';

interface AdminDashboardProps {
  user: any;
  data: {
    totalStudents: number;
    totalTeachers: number;
    attendanceRate: number;
    upcomingEvents: number;
    totalParents: number;
    totalClasses: number;
    totalRevenue: number;
    totalStaff: number;
    monthlyAttendance: { month: string; rate: number }[];
    classDistribution: { name: string; students: number }[];
    monthlyRevenue: { month: string; amount: number }[];
    feeByType: { type: string; collected: number; pending: number }[];
    maleStudents: number;
    femaleStudents: number;
    recentNotices: { id: string; title: string; content: string; date: string }[];
  };
  refreshing: boolean;
  onRefresh: () => void;
}

export function AdminDashboard({ user, data, refreshing, onRefresh }: AdminDashboardProps) {
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
      >
        <SubscriptionAlert tenantEndDate={user?.tenantEndDate} />

        <WelcomeBanner
          userName={user?.name || 'Admin'}
          tenantName={user?.tenantName}
          tenantLogo={user?.tenantLogo}
          summaryData={{
            totalStudents: data.totalStudents,
            totalTeachers: data.totalTeachers,
            attendanceRate: data.attendanceRate,
            upcomingEvents: data.upcomingEvents,
          }}
        />

        <MetricStats data={{
          totalParents: data.totalParents,
          totalClasses: data.totalClasses,
          totalRevenue: data.totalRevenue,
          totalStaff: data.totalStaff,
        }} />

        <DashboardCharts 
          attendanceData={data.monthlyAttendance}
          classData={data.classDistribution}
          revenueData={data.monthlyRevenue}
          feeByType={data.feeByType}
          maleStudents={data.maleStudents}
          femaleStudents={data.femaleStudents}
        />

        <RecentNotices data={data.recentNotices} />

        <View style={{ height: 30 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
});
