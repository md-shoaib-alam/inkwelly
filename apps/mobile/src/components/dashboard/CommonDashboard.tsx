import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, ActivityIndicator, View, ScrollView, RefreshControl, Image, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, globalDashboardCache, setGlobalDashboardCache } from '@/store/auth-context';
import { api, withRetry } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';

// Import role-based dashboards
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { TeacherDashboard } from '@/components/teacher/TeacherDashboard';
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { ParentDashboard } from '@/components/parent/ParentDashboard';
import { StaffDashboard } from '@/components/staff/StaffDashboard';
import { TenantHeader } from '@/components/ui/TenantHeader';
import { StudentDashboardSkeleton } from '@/components/ui/StudentDashboardSkeleton';

interface DashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalStaff: number;
  totalRevenue: number;
  attendanceRate: number;
  upcomingEvents: number;
  monthlyAttendance: { month: string; rate: number }[];
  classDistribution: { name: string; students: number }[];
  feeByType: { type: string; collected: number; pending: number }[];
  monthlyRevenue: { month: string; amount: number }[];
  recentNotices: { id: string; title: string; content: string; date: string }[];
  maleStudents: number;
  femaleStudents: number;
}

export default function CommonDashboard() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const [isLoading, setIsLoading] = useState(!globalDashboardCache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [data, setData] = useState<any | null>(globalDashboardCache);

  // Cancels the in-flight withRetry loop when a newer call supersedes it
  const abortRef = useRef<AbortController | null>(null);

  const mapData = (res: any): DashboardData => {
    return {
      totalStudents: res.totalStudents || 0,
      totalTeachers: res.totalTeachers || 0,
      totalParents: res.totalParents || 0,
      totalClasses: res.totalClasses || 0,
      totalStaff: res.totalStaff || 0,
      totalRevenue: res.totalRevenue || 0,
      attendanceRate: res.attendanceRate || 0,
      upcomingEvents: res.upcomingEvents || 0,
      monthlyAttendance: res.monthlyAttendance || [],
      classDistribution: res.classDistribution || [],
      feeByType: res.feeByType || [],
      monthlyRevenue: res.monthlyRevenue || [],
      maleStudents: res.maleStudents || 0,
      femaleStudents: res.femaleStudents || 0,
      recentNotices: (res.recentNotices || []).map((notice: any) => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        date: notice.createdAt ? notice.createdAt.slice(0, 10) : '',
      })),
    };
  };

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    // Cancel any previous in-flight retry loop
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (isRefresh) {
      setIsRefreshing(true);
      setIsRetrying(false);
    } else if (!globalDashboardCache) {
      setIsLoading(true);
      setIsRetrying(false);
    }

    try {
      let freshData: any = null;

      if (user?.role === 'parent') {
        const parentQuery = `
          query ParentDashboard($parentName: String!) {
            parentDashboard(parentName: $parentName) {
              children { 
                id userId name email className classId rollNumber gender dateOfBirth admissionDate
                grades { id studentId studentName subjectName examType marks maxMarks grade createdAt }
                attendance { id studentId studentName className date status remarks }
              }
              notices { id title content authorName priority createdAt targetRole }
              fees { id studentName type amount status dueDate paidAmount }
              performanceSummary { name attendanceRate avgGrade grade }
              subscriptionPlan
            }
          }
        `;
        const gqlRes = await withRetry(
          () => api.post('/graphql', { query: parentQuery, variables: { parentName: user.name } }),
          4,
          1500,
          controller.signal
        );
        if ((gqlRes as any).errors?.length > 0) {
          throw new Error((gqlRes as any).errors[0].message);
        }
        freshData = (gqlRes as any).data?.parentDashboard || {};
      } else if (user?.role === 'teacher') {
        const teacherQuery = `
          query TeacherDashboard($teacherName: String!) {
            teacherDashboard(teacherName: $teacherName) {
              teacherId
              classes { id name section studentCount }
              subjects { id name code className }
              totalStudents
              pendingAssignments
              todaySchedule { id day startTime endTime subjectName className }
              todayAttendance { present total }
              todaySelfAttendance { status checkIn checkOut }
              recentAssignments { id title subjectName className dueDate submissions totalStudents mode }
            }
          }
        `;
        const [gqlRes, restRes] = await Promise.allSettled([
          withRetry(
            () => api.post('/graphql', { query: teacherQuery, variables: { teacherName: user.name } }),
            4,
            1500,
            controller.signal
          ),
          withRetry(
            () => api.get<any>('/dashboard'),
            4,
            1500,
            controller.signal
          ),
        ]);

        let teacherData: any = {};
        if (gqlRes.status === 'fulfilled') {
          const gqlVal = gqlRes.value as any;
          if (!gqlVal?.errors?.length) {
            teacherData = gqlVal?.data?.teacherDashboard || {};
          }
        }

        let genericData: any = {};
        if (restRes.status === 'fulfilled') {
          genericData = mapData(restRes.value);
        }

        freshData = {
          ...genericData,
          ...teacherData,
          totalClasses: teacherData.classes?.length ?? genericData.totalClasses ?? 0,
          totalStudents: teacherData.totalStudents ?? genericData.totalStudents ?? 0,
          pendingAssignments: teacherData.pendingAssignments ?? 0,
          recentNotices: genericData.recentNotices || [],
        };
      } else {
        // Retry with backoff for server cold-start / transient 5xx errors
        const res = await withRetry(
          () => api.get<any>('/dashboard'),
          4,        // up to 4 total attempts
          1500,     // 1.5 s → 3 s → 6 s
          controller.signal
        );
        freshData = mapData(res);
      }

      if (controller.signal.aborted) return;
      setData(freshData);
      setGlobalDashboardCache(freshData);
    } catch (error: any) {
      if (controller.signal.aborted || error?.message === 'Cancelled') return;
      console.error('Failed to load dashboard data:', error);
      if (!globalDashboardCache) {
        setData(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsRetrying(false);
      }
    }
  }, [user]);

  // Show "retrying" hint after first 2 s of loading so users know it's auto-healing
  useEffect(() => {
    if (!isLoading) { setIsRetrying(false); return; }
    const t = setTimeout(() => setIsRetrying(true), 2000);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  useEffect(() => {
    // If offline on start and loading fails (data is null), auto-retry when we go online
    if (!data && !isLoading && user?.id) {
      let isFirstRun = true;
      const unsubscribe = NetInfo.addEventListener(state => {
        if (isFirstRun) {
          isFirstRun = false;
          return;
        }
        const online = state.isInternetReachable ?? state.isConnected;
        if (online) {
          loadDashboardData();
        }
      });
      return () => unsubscribe();
    }
  }, [data, isLoading, user?.id, loadDashboardData]);

  const handleRefresh = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  const handleChildSwitch = useCallback(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  if (isLoading && user?.role === 'parent') {
    return (
      <ThemedView style={{ flex: 1 }} safeAreaTop>
        {/* Header Skeleton */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.backgroundSelected
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <Skeleton width={120} height={18} />
          </View>
          <Skeleton width={44} height={44} borderRadius={22} />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
          }
        >
          {/* My Children Title */}
          <Skeleton width={100} height={14} style={{ marginBottom: 12 }} />

          {/* Child Card Skeleton */}
          <View style={{ 
            padding: 20, 
            borderRadius: 20, 
            backgroundColor: colors.backgroundElement, 
            borderWidth: 1.5, 
            borderColor: colors.backgroundSelected,
            marginBottom: 20
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ gap: 6 }}>
                <Skeleton width={100} height={12} />
                <Skeleton width={150} height={20} />
              </View>
              <Skeleton width={48} height={48} borderRadius={24} />
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ gap: 4 }}>
                <Skeleton width={80} height={10} />
                <Skeleton width={60} height={14} />
              </View>
              <View style={{ gap: 4 }}>
                <Skeleton width={80} height={10} />
                <Skeleton width={40} height={14} />
              </View>
            </View>
          </View>

          {/* Promo Banner Skeleton */}
          <Skeleton width="100%" height={70} borderRadius={20} style={{ marginBottom: 20 }} />

          {/* Quick Actions Grid Skeleton */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ flexDirection: 'row', gap: 12, paddingRight: 16, marginBottom: 8 }}
          >
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={{ 
                width: 86, 
                padding: 16, 
                borderRadius: 12, 
                backgroundColor: colors.backgroundElement,
                borderWidth: 1,
                borderColor: colors.backgroundSelected,
                gap: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Skeleton width={36} height={36} borderRadius={10} />
                <Skeleton width={50} height={12} />
              </View>
            ))}
          </ScrollView>

          {/* Quick Actions Title */}
          <Skeleton width={120} height={14} style={{ marginBottom: 12 }} />
          {/* Quick Actions Row Skeleton */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 20 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ 
                flex: 1, 
                paddingVertical: 14, 
                borderRadius: 16, 
                backgroundColor: colors.backgroundElement,
                borderWidth: 1,
                borderColor: colors.backgroundSelected,
                alignItems: 'center',
                gap: 8
              }}>
                <Skeleton width={38} height={38} borderRadius={12} />
                <Skeleton width={60} height={12} />
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>No user session found.</ThemedText>
      </ThemedView>
    );
  }

  if (!isLoading && !data) {
    return (
      <ThemedView style={styles.center} safeAreaTop>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconContainer, { backgroundColor: isDark ? 'rgba(255,59,48,0.1)' : 'rgba(255,59,48,0.05)' }]}>
            <Ionicons name="cloud-offline-outline" size={48} color={isDark ? '#FF453A' : '#FF3B30'} />
          </View>
          <ThemedText style={styles.errorTitle}>Connection Error</ThemedText>
          <ThemedText style={styles.errorSubtitle}>
            We couldn't retrieve the dashboard data. Please check your internet connection and try again.
          </ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: '#007AFF' }]} 
            onPress={() => loadDashboardData(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const renderLoadingContent = () => {
    if (user?.role === 'student') {
      return <StudentDashboard user={user} data={data} refreshing={isRefreshing} onRefresh={handleRefresh} />;
    }
    return <DashboardSkeleton isRefreshing={isRefreshing} onRefresh={handleRefresh} />;
  };

  const renderDashboardContent = () => {
    const role = user?.role;
    if (!role) {
      return (
        <ThemedView style={styles.center}>
          <ThemedText>No user session found.</ThemedText>
        </ThemedView>
      );
    }
    switch (role) {
      case 'super_admin':
      case 'admin':
        return <AdminDashboard user={user} data={data} refreshing={isRefreshing} onRefresh={handleRefresh} />;
      case 'teacher':
        return <TeacherDashboard user={user} data={data} refreshing={isRefreshing} onRefresh={handleRefresh} />;
      case 'student':
        return <StudentDashboard user={user} data={data} refreshing={isRefreshing} onRefresh={handleRefresh} />;
      case 'parent':
        return <ParentDashboard user={user} data={data} refreshing={isRefreshing} onRefresh={handleRefresh} onChildSwitch={handleChildSwitch} />;
      case 'staff':
        return <StaffDashboard user={user} data={data} refreshing={isRefreshing} onRefresh={handleRefresh} />;
      default:
        return (
          <ThemedView style={styles.center}>
            <ThemedText>No dashboard layout configured for role: {role}</ThemedText>
          </ThemedView>
        );
    }
  };

  return (
    <ThemedView style={{ flex: 1 }} safeAreaTop>
      {user && (user.role === 'admin' || user.role === 'teacher' || user.role === 'student' || user.role === 'staff') && (
        <TenantHeader user={user} />
      )}
      {isLoading ? renderLoadingContent() : renderDashboardContent()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  retryingBadge: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.10)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  retryingText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});
