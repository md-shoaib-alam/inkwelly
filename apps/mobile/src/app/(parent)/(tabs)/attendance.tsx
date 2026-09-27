import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';

// Sub-components
import { ChildSelector } from '@/components/parent/ChildSelector';
import { TodayAttendanceCard } from '@/components/attendance/TodayAttendanceCard';
import { AttendanceSkeleton } from '@/components/attendance/AttendanceSkeleton';
import { Skeleton } from '@/components/Skeleton';

export default function ParentAttendanceScreen() {
  const { user } = useAuth();
  const { activeTheme, selectedChildId, setSelectedChildId } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [children, setChildren] = useState<any[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchAttendanceData = useCallback(async () => {
    if (!user?.name) return;
    try {
      const parentQuery = `
        query ParentDashboard($parentName: String!) {
          parentDashboard(parentName: $parentName) {
            children { 
              id name className rollNumber classId
              attendance { id date status remarks }
            }
          }
        }
      `;
      const gqlRes = await api.post<any>('/graphql', { query: parentQuery, variables: { parentName: user.name } });
      if (gqlRes?.errors && gqlRes.errors.length > 0) {
        throw new Error(gqlRes.errors[0].message);
      }
      const data = gqlRes?.data?.parentDashboard || {};
      const childList = data.children || [];
      setChildren(childList);
      if (childList.length > 0 && !selectedChildId) {
         setSelectedChildId(childList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch attendance dashboard:', error);
    } finally {
      setHasLoaded(true);
    }
  }, [selectedChildId, setSelectedChildId, user?.name]);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await api.get<any>('/subscriptions');
      if (res?.activeSubscription?.planId) {
        setSubscriptionPlan(res.activeSubscription.planId.toLowerCase() as any);
      } else {
        setSubscriptionPlan('basic');
      }
    } catch (error) {
      console.warn('Failed to fetch subscription in attendance:', error);
      setSubscriptionPlan('basic');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([fetchAttendanceData(), fetchSubscription()]);
    }, [fetchAttendanceData, fetchSubscription])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchAttendanceData(), fetchSubscription()]);
    setIsRefreshing(false);
  };

  const maxOffset = useMemo(() => {
    if (subscriptionPlan === 'premium') return 6;
    if (subscriptionPlan === 'standard') return 3;
    return 0;
  }, [subscriptionPlan]);

  const effectiveCalendarOffset = useMemo(() => Math.min(calendarOffset, maxOffset), [calendarOffset, maxOffset]);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - effectiveCalendarOffset);
    return d;
  }, [effectiveCalendarOffset]);

  const activeChild = useMemo(() => children.find(c => c.id === selectedChildId) || children[0], [children, selectedChildId]);
  const attendanceRecords = useMemo(() => activeChild?.attendance ?? [], [activeChild]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter((r: any) => r.status === 'present' || r.status === 'late').length;
    const absent = attendanceRecords.filter((r: any) => r.status === 'absent').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { present, absent, total, rate };
  }, [attendanceRecords]);

  // Construct grid data for baseDate month (same as student)
  const calendarData = useMemo(() => {
    const currentMonth = baseDate.getMonth();
    const currentYear = baseDate.getFullYear();
    const now = new Date();
    const today = now.getDate();
    const isCurrentMonth = now.getMonth() === currentMonth && now.getFullYear() === currentYear;

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const attMap = new Map<string, string>();
    attendanceRecords.forEach((rec: any) => {
      const dateKey = rec.date.slice(0, 10);
      attMap.set(dateKey, rec.status);
    });

    const days: ({ day: number; date: Date; status: string; isToday: boolean } | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dateStr = format(dateObj, 'yyyy-MM-dd');
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

    return { rows, monthName: baseDate.toLocaleString('default', { month: 'long' }).toUpperCase(), year: currentYear };
  }, [attendanceRecords, baseDate]);

  const getStatusColor = (status: string) => {
    if (status === 'present' || status === 'late') return '#00C853'; // Vibrant Green
    if (status === 'absent') return '#FF3D00'; // Vibrant Red
    return activeTheme === 'light' ? '#FFFFFF' : '#1C1C1E';
  };

  const changeMonth = (offset: number) => {
    setCalendarOffset(prev => {
      const next = prev - offset;
      if (next < 0) return 0;
      if (next > maxOffset) return prev;
      return next;
    });
  };

  const canGoBack = effectiveCalendarOffset < maxOffset;
  const canGoForward = effectiveCalendarOffset > 0;

  const isLoading = isRefreshing || !hasLoaded;
  const isInitialLoading = !hasLoaded;

  if (isInitialLoading) {
    return (
      <ThemedView style={styles.container} safeAreaTop>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Attendance Overview</ThemedText>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#34C759']} />}
        >
          {/* ChildSelector Skeleton */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <Skeleton width={80} height={32} borderRadius={16} />
            <Skeleton width={100} height={32} borderRadius={16} />
            <Skeleton width={90} height={32} borderRadius={16} />
          </View>

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

  if (hasLoaded && children.length === 0) {
    return (
      <ThemedView style={styles.container} safeAreaTop>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Attendance</ThemedText>
        </View>
        <ScrollView 
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#34C759']} />}
        >
          <View style={{ alignItems: 'center', gap: 16 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.backgroundSelected, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: colors.text }}>No Wards Linked</ThemedText>
            <ThemedText style={{ fontSize: 14, textAlign: 'center', color: colors.textSecondary, lineHeight: 20 }}>
              There are no student profiles currently linked to this parent account. Please contact the school administration to link your children.
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safeAreaTop>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Attendance</ThemedText>
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#34C759']} />}
      >
        {children.length > 0 && (
          <ChildSelector 
            students={children} 
            selectedStudentId={selectedChildId} 
            onSelect={setSelectedChildId} 
          />
        )}

        {isLoading ? (
          <>
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
          </>
        ) : (
          <>
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
                  <Ionicons name="pie-chart" size={20} color="#007AFF" />
                  <ThemedText style={styles.statVal}>{stats.rate}%</ThemedText>
                  <ThemedText style={[styles.statLbl, { color: colors.textSecondary }]}>Rate</ThemedText>
                </View>
              </View>
            </View>

            {/* Today Attendance Card */}
            <TodayAttendanceCard records={attendanceRecords} />

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
              {subscriptionPlan === 'basic' ? (
                <TouchableOpacity 
                  onPress={() => router.push('/(parent)/subscription')}
                  style={[styles.navBtn, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4 }]}
                >
                  <Ionicons name="lock-closed" size={14} color="#FFB300" style={{ marginRight: 6 }} />
                  <ThemedText style={styles.calendarSubtitle}>{calendarData.monthName} {calendarData.year}</ThemedText>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={() => changeMonth(-1)} 
                    style={[styles.navBtn, !canGoBack && { opacity: 0.3 }]}
                    disabled={!canGoBack}
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={styles.historyBadge}>
                    <ThemedText style={styles.calendarSubtitle}>{calendarData.monthName} {calendarData.year}</ThemedText>
                  </View>
                  <TouchableOpacity 
                    onPress={() => changeMonth(1)} 
                    style={[styles.navBtn, !canGoForward && { opacity: 0.3 }]}
                    disabled={!canGoForward}
                  >
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </>
              )}
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
                          color: (item.status === 'present' || item.status === 'late' || item.status === 'absent') ? '#FFF' : colors.text,
                          opacity: (item.status === 'present' || item.status === 'late' || item.status === 'absent') ? 1 : 0.3
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
        </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1,
    textAlign: 'center',
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
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
  },
  lockedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFB300',
    marginBottom: 2,
    textAlign: 'center',
  },
  lockedSubtext: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.8,
  },
  unlockBtn: {
    backgroundColor: '#FFB300',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  unlockBtnText: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 12,
  },
});
