import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';

// Sub-components
import { ChildSelector } from '@/components/parent/ChildSelector';
import { Skeleton } from '@/components/Skeleton';

interface TimetableSlot {
  id: string;
  classId: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  label?: string; // e.g. "Lunch Break"
  className?: string;
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
];

const getNow = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const jsDay = now.getDay();
  const dayMap: Record<number, string> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  return {
    timeStr: `${h}:${m}`,
    dayKey: dayMap[jsDay] || 'monday',
  };
};

export default function ParentTimetableScreen() {
  const { user } = useAuth();
  const { activeTheme, selectedChildId, setSelectedChildId } = useSettings();
  const colors = Colors[activeTheme];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(() => getNow().dayKey);
  const [children, setChildren] = useState<any[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [currentTime, setCurrentTime] = useState(() => getNow().timeStr);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getNow().timeStr);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchChildren = async () => {
    if (!user?.name) return;
    try {
      const parentQuery = `
        query ParentDashboard($parentName: String!) {
          parentDashboard(parentName: $parentName) {
            children { 
              id name className rollNumber classId
            }
          }
        }
      `;
      const gqlRes = await api.post<any>('/graphql', { query: parentQuery, variables: { parentName: user.name } });
      if (gqlRes.errors && gqlRes.errors.length > 0) {
        throw new Error(gqlRes.errors[0].message);
      }
      const data = gqlRes.data?.parentDashboard || {};
      const childList = data.children || [];
      setChildren(childList);
      if (childList.length > 0 && !selectedChildId) {
        setSelectedChildId(childList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch parent children:', error);
    }
  };

  const activeChild = children.find(c => c.id === selectedChildId) || children[0];

  const fetchTimetable = async () => {
    if (!activeChild?.classId) {
      setSlots([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const startTime = Date.now();
      const ttRes = await api.get('/timetable', {
        params: { classId: activeChild.classId }
      });
      setSlots(Array.isArray(ttRes) ? ttRes : []);
      const elapsed = Date.now() - startTime;
      const minDuration = 400;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
    } catch (error) {
      console.error('Failed to fetch timetable slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchChildren();
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTimetable();
  }, [activeChild]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChildren();
    await fetchTimetable();
    setIsRefreshing(false);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const activeDaySlots = useMemo(() => {
    return slots
      .filter((s) => s.day.toLowerCase() === selectedDay.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, selectedDay]);

  const todayKey = useMemo(() => getNow().dayKey, []);

  if (!isLoading && children.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#5856D6']} />}
        >
          <View style={{ alignItems: 'center', padding: 24, gap: 16 }}>
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
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#5856D6']} />}
      >
        <ChildSelector 
          students={children} 
          selectedStudentId={selectedChildId || ''} 
          onSelect={setSelectedChildId} 
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
          {DAYS.map((day) => {
            const isActive = selectedDay === day.key;
            return (
              <TouchableOpacity 
                key={day.key} 
                onPress={() => setSelectedDay(day.key)}
                style={[
                  styles.dayChip, 
                  isActive && { backgroundColor: '#5856D6' },
                  !isActive && { backgroundColor: activeTheme === 'light' ? 'rgba(88, 86, 214, 0.08)' : 'rgba(88, 86, 214, 0.15)' }
                ]}
              >
                <ThemedText style={[
                  styles.dayText, 
                  isActive && { color: '#FFF' },
                  !isActive && { color: '#5856D6' }
                ]}>
                  {day.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={{ gap: 16, marginTop: 12 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.slotCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, borderWidth: 1.5 }]}>
                <View style={styles.slotHeader}>
                  <Skeleton width="45%" height={12} />
                </View>
                <Skeleton width="65%" height={18} style={{ marginBottom: 8 }} />
                <View style={styles.teacherRow}>
                  <Skeleton width="35%" height={14} />
                </View>
              </View>
            ))}
          </View>
        ) : activeDaySlots.length > 0 ? (
          activeDaySlots.map((item, index) => {
            const isBreak = !item.subjectName && !!item.label;
            const isOngoing = !isBreak && todayKey === selectedDay.toLowerCase() && currentTime >= item.startTime && currentTime <= item.endTime;

            return (
              <View 
                key={item.id || index} 
                style={[
                  styles.slotCard, 
                  { 
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.backgroundSelected
                  },
                  isOngoing && { 
                    borderColor: '#34C759', 
                    borderWidth: 2,
                    shadowColor: '#34C759',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5,
                    backgroundColor: activeTheme === 'light' ? '#F0FFF4' : '#142918'
                  }
                ]}
              >
                <View style={styles.slotHeader}>
                  <ThemedText style={styles.slotTime}>{formatTime(item.startTime)} - {formatTime(item.endTime)}</ThemedText>
                  {isOngoing && (
                    <View style={styles.ongoingBadge}>
                      <ThemedText style={styles.ongoingText}>ONGOING</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.subjectTitle}>
                  {isBreak ? item.label : item.subjectName}
                </ThemedText>
                {!isBreak && item.teacherName ? (
                  <View style={styles.teacherRow}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <ThemedText style={[styles.teacherName, { color: colors.textSecondary }]}>{item.teacherName}</ThemedText>
                  </View>
                ) : isBreak ? (
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>Recess / Break Time</ThemedText>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#C7C7CC" />
            <ThemedText style={styles.emptyTitle}>No Classes Scheduled</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              There are no lectures scheduled for {DAYS.find(d => d.key === selectedDay)?.label || selectedDay}.
            </ThemedText>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
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
  daySelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dayChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  slotCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  ongoingBadge: {
    backgroundColor: '#34C75920',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ongoingText: {
    color: '#34C759',
    fontSize: 9,
    fontWeight: 'bold',
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 13,
    marginLeft: 4,
  },
  center: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
