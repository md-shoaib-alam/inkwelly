import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';

// Reusing parent components for consistency
import { AttendanceStats } from '@/modules/attendance/components/parentAttendance/AttendanceStats';
import { AttendanceCalendar } from '@/modules/attendance/components/parentAttendance/AttendanceCalendar';

export default function StaffAttendanceScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - calendarOffset);
    return d;
  }, [calendarOffset]);

  const periodLabel = useMemo(() => {
    return baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [baseDate]);

  const fetchAttendance = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await api.get('/staff-attendance', {
        params: { userId: user.id }
      });
      setAttendanceRecords(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Failed to load staff attendance:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAttendance();
    }
  }, [user?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAttendance();
  };

  const stats = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter((r: any) => r.status === 'present' || r.status === 'late').length;
    const absent = attendanceRecords.filter((r: any) => r.status === 'absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
    return { percentage, present, absent };
  }, [attendanceRecords]);

  const calendarData = useMemo(() => {
    const currentMonth = baseDate.getMonth();
    const currentYear = baseDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const attMap = new Map<string, string>();
    attendanceRecords.forEach((rec: any) => {
      if (rec.date) {
        const dateKey = rec.date.slice(0, 10);
        attMap.set(dateKey, rec.status);
      }
    });

    const days: any[] = [];
    
    // Previous month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        status: 'none',
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const status = attMap.get(dateStr) || 'none';
      days.push({
        day: d,
        status,
        isCurrentMonth: true,
      });
    }

    // Next month padding days to complete grid
    const totalCells = days.length > 35 ? 42 : 35;
    const nextMonthDaysNeeded = totalCells - days.length;
    for (let d = 1; d <= nextMonthDaysNeeded; d++) {
      days.push({
        day: d,
        status: 'none',
        isCurrentMonth: false,
      });
    }

    return days;
  }, [attendanceRecords, baseDate]);

  return (
    <ThemedView style={styles.container} safeAreaTop>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle-outline" size={24} color="#007AFF" />
        <ThemedText style={styles.headerTitle}>My Attendance</ThemedText>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
        >
          <AttendanceStats 
            percentage={stats.percentage}
            present={stats.present}
            absent={stats.absent}
          />

          <AttendanceCalendar 
            data={calendarData}
            currentPeriod={periodLabel}
            onPrev={() => setCalendarOffset(prev => prev + 1)}
            onNext={() => setCalendarOffset(prev => Math.max(0, prev - 1))}
          />

          <View style={[styles.infoCard, { backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="finger-print-outline" size={20} color="#34C759" />
            <ThemedText style={styles.infoText}>
              Attendance is logged via biometric scan at the staff entrance. Please ensure you scan in before 9:00 AM.
            </ThemedText>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 12,
    opacity: 0.7,
    lineHeight: 18,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
