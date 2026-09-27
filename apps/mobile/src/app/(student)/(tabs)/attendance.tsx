import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { TodayAttendanceCard } from '@/components/attendance/TodayAttendanceCard';
import { Skeleton } from '@/components/Skeleton';
import type { StudentProfile, AttendanceRecord } from '@/types';

export default function StudentAttendanceScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  const [viewDate, setViewDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const studentMe = await api.get<any>('/students/me');
      setProfile(studentMe);

      if (studentMe && studentMe.id) {
        const attRes = await api.get<any>('/attendance', { 
          params: { studentId: studentMe.id, limit: '1000' } 
        });
        const records = Array.isArray(attRes.records) ? attRes.records : [];
        setAttendance(records);
      }
    } catch (error) {
      console.error('Failed to load student attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const isCurrentOrFutureMonth = useMemo(() => {
    const now = new Date();
    return (
      viewDate.getFullYear() > now.getFullYear() ||
      (viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() >= now.getMonth())
    );
  }, [viewDate]);

  const changeMonth = (offset: number) => {
    if (offset > 0 && isCurrentOrFutureMonth) return;
    const next = new Date(viewDate);
    next.setMonth(viewDate.getMonth() + offset);
    setViewDate(next);
  };

  // Compute stats
  const stats = useMemo(() => {
    const present = attendance.filter((a) => a.status === 'present' || a.status === 'late' || a.status === 'half-day' || a.status === 'half_day').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const total = attendance.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { present, absent, total, rate };
  }, [attendance]);

  // Monthly View Grid
  const calendarData = useMemo(() => {
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();
    const now = new Date();
    const today = now.getDate();
    const isCurrentMonth = now.getMonth() === currentMonth && now.getFullYear() === currentYear;

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const attMap = new Map<string, string>();
    attendance.forEach(rec => {
      const dateKey = rec.date.slice(0, 10);
      attMap.set(dateKey, rec.status);
    });

    const days: ({ day: number; date: Date; status: string; isToday: boolean } | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const status = attMap.get(dateStr) || 'none';
      const isToday = isCurrentMonth && d === today;
      days.push({ day: d, date: dateObj, status, isToday });
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    const rows: ({ day: number; date: Date; status: string; isToday: boolean } | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }

    return { rows, monthName: viewDate.toLocaleString('default', { month: 'long' }).toUpperCase(), year: currentYear };
  }, [attendance, viewDate]);

  const getStatusColor = (status: string) => {
    if (status === 'present' || status === 'late' || status === 'half-day' || status === 'half_day') return '#00C853'; // Vibrant Green
    if (status === 'absent') return '#FF3D00'; // Vibrant Red
    return activeTheme === 'light' ? '#FFFFFF' : '#1C1C1E';
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Stats Boxes Skeleton */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ flex: 1, height: 85, borderRadius: 12, padding: 12, backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.backgroundSelected, alignItems: 'center', justifyContent: 'space-between' }}>
                <Skeleton width={20} height={20} borderRadius={10} />
                <Skeleton width="50%" height={16} />
                <Skeleton width="40%" height={10} />
              </View>
            ))}
          </View>

          {/* Today Attendance Card Skeleton */}
          <View style={{ borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.backgroundSelected, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Skeleton width={130} height={16} borderRadius={4} />
            <Skeleton width={70} height={24} borderRadius={8} />
          </View>

          {/* Calendar Card Skeleton */}
          <View style={{ borderRadius: 24, padding: 16, backgroundColor: colors.backgroundElement, minHeight: 320, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Skeleton width="40%" height={20} />
              <Skeleton width="30%" height={24} borderRadius={12} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} style={{ flex: 1 }} height={12} />
              ))}
            </View>
            {[1, 2, 3, 4].map(rowIdx => (
              <View key={rowIdx} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5, 6, 7].map(colIdx => (
                  <Skeleton key={colIdx} style={{ flex: 1 }} height={32} borderRadius={6} />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsOverview}>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: colors.backgroundElement, borderColor: '#34C759' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <ThemedText style={styles.statVal}>{stats.present}</ThemedText>
              <ThemedText style={[styles.statLbl, { color: colors.textSecondary }]}>Present</ThemedText>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.backgroundElement, borderColor: '#FF3B30' }]}>
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
              <ThemedText style={styles.statVal}>{stats.absent}</ThemedText>
              <ThemedText style={[styles.statLbl, { color: colors.textSecondary }]}>Absent</ThemedText>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.backgroundElement, borderColor: '#007AFF' }]}>
              <Ionicons name="stats-chart" size={20} color="#007AFF" />
              <ThemedText style={styles.statVal}>{stats.rate}%</ThemedText>
              <ThemedText style={[styles.statLbl, { color: colors.textSecondary }]}>Rate</ThemedText>
            </View>
          </View>
        </View>

        {/* Today Attendance Card */}
        <TodayAttendanceCard records={attendance} />

        {/* Calendar Card */}
        <View style={[styles.calendarCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.calendarHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={22} color="#FF8F00" />
              </View>
              <ThemedText style={styles.calendarTitle}>Calendar</ThemedText>
            </View>
            
            <View style={styles.historyContainer}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={styles.historyBadge}>
                <ThemedText style={styles.calendarSubtitle}>{calendarData.monthName} {calendarData.year}</ThemedText>
              </View>
              <TouchableOpacity 
                onPress={() => changeMonth(1)} 
                disabled={isCurrentOrFutureMonth}
                style={[styles.navBtn, isCurrentOrFutureMonth && { opacity: 0.3 }]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.gridHeader}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <ThemedText key={d} style={[styles.gridHeaderLabel, { color: colors.textSecondary }]}>{d}</ThemedText>
            ))}
          </View>

          {calendarData.rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.weekRow}>
              {row.map((item, colIdx) => {
                if (!item) {
                  return <View key={`e-${rowIdx}-${colIdx}`} style={styles.dayCell} />;
                }
                const statusColor = getStatusColor(item.status);
                
                return (
                  <View
                    key={item.date.toISOString()}
                    style={[
                      styles.dayCell,
                      { 
                        backgroundColor: statusColor,
                        borderWidth: item.isToday ? 2 : 0,
                        borderColor: '#A855F7',
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.dayText,
                        { 
                          color: (item.status === 'present' || item.status === 'late' || item.status === 'half-day' || item.status === 'half_day' || item.status === 'absent') ? '#FFF' : colors.text,
                          opacity: (item.status === 'present' || item.status === 'late' || item.status === 'half-day' || item.status === 'half_day' || item.status === 'absent') ? 1 : 0.3
                        },
                      ]}
                    >
                      {item.day}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#00C853' }]} />
              <ThemedText style={[styles.legendLabel, { color: colors.textSecondary }]}>PRESENT</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3D00' }]} />
              <ThemedText style={[styles.legendLabel, { color: colors.textSecondary }]}>ABSENT</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[
                styles.legendDot, 
                { 
                  backgroundColor: activeTheme === 'light' ? '#FFFFFF' : '#1C1C1E',
                  borderWidth: 1,
                  borderColor: activeTheme === 'light' ? '#D1D1D6' : '#2C2C2E'
                }
              ]} />
              <ThemedText style={[styles.legendLabel, { color: colors.textSecondary }]}>OFF</ThemedText>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  statsOverview: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: 96,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
    textAlign: 'center',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 143, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  calendarSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB300',
  },
  historyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.08)',
    borderRadius: 20,
    padding: 2,
    flexShrink: 0,
  },
  navBtn: {
    padding: 6,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  historyText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gridHeader: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  gridHeaderLabel: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 10,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayCell: {
    flex: 1,
    height: 38,
    marginHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120, 120, 128, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  card: {
    borderRadius: 24,
    marginBottom: 16,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});



