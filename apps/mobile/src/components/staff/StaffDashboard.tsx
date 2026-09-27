import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { RecentNotices } from '@/components/dashboard/RecentNotices';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { hasPermission, staffHasNoGrants } from '@/lib/permissions';
import type { AppUser, DashboardData } from '@/types';

interface StaffDashboardProps {
  user: AppUser;
  data: DashboardData | null;
  refreshing: boolean;
  onRefresh: () => void;
}

export function StaffDashboard({ user, data, refreshing, onRefresh }: StaffDashboardProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();

  const staffStats = useMemo(() => [
    { label: 'Tasks', value: '5 / 8', icon: 'checkbox', color: '#34C759', route: '/(staff)/(tabs)/tasks', show: hasPermission(user, 'tasks', 'view') },
    { label: 'Attendance', value: '98%', icon: 'checkmark-circle', color: '#007AFF', route: '/(staff)/(tabs)/attendance', show: hasPermission(user, 'attendance', 'view') },
    { label: 'Leaves', value: '3 Pending', icon: 'calendar', color: '#FF9500', route: '/(staff)/(tabs)/leaves', show: hasPermission(user, 'leaves', 'view') },
    { label: 'Tickets', value: '2 Active', icon: 'ticket', color: '#FF3B30', route: '/(staff)/(tabs)/tickets', show: true },
    { label: 'Finance', value: 'Manage', icon: 'wallet', color: '#8E8E93', route: '/(staff)/(tabs)/fees', show: hasPermission(user, 'fees', 'view') },
    { label: 'Expenses', value: 'Manage', icon: 'cash', color: '#FF2D55', route: '/(staff)/(tabs)/expenses', show: hasPermission(user, 'expenses', 'view') },
    { label: 'Students', value: 'Manage', icon: 'people', color: '#AF52DE', route: '/(staff)/(tabs)/students', show: hasPermission(user, 'students', 'view') },
    { label: 'Teachers', value: 'Manage', icon: 'business', color: '#5856D6', route: '/(staff)/(tabs)/teachers', show: hasPermission(user, 'teachers', 'view') },
    { label: 'Classes', value: 'Manage', icon: 'school', color: '#FF9500', route: '/(staff)/(tabs)/classes', show: hasPermission(user, 'classes', 'view') },
    { label: 'Subjects', value: 'Manage', icon: 'book', color: '#34C759', route: '/(staff)/(tabs)/subjects', show: hasPermission(user, 'subjects', 'view') },
    { label: 'Notices', value: 'View', icon: 'megaphone', color: '#007AFF', route: '/(staff)/(tabs)/notices', show: true },
  ].filter(stat => stat.show), [user]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
      >
        <WelcomeBanner
          userName={user?.name || 'Staff'}
          tenantName={user?.tenantName}
          tenantLogo={user?.tenantLogo}
        />

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {staffStats.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.statCard, { backgroundColor: colors.backgroundElement }]}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</ThemedText>
              <ThemedText style={styles.statNumber}>{item.value}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {staffHasNoGrants(user) && (
          <View style={[styles.accessNotice, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>Access not assigned yet</ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                Your staff account has no modules enabled, so student, fee and class screens stay hidden.
                Ask your school admin to assign you a role under Admin → Roles & Permissions.
              </ThemedText>
            </View>
          </View>
        )}

        <RecentNotices data={data?.recentNotices || []} />

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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  accessNotice: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: 'bold',
  },
});
