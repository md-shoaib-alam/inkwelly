import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';

const TypedFlashList = FlashList as any;

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
  room?: string;
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

export default function StudentTimetableScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    return getNow().dayKey;
  });

  const [currentTime, setCurrentTime] = useState(() => getNow().timeStr);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getNow().timeStr);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const studentMe = await api.get('/students/me');
      setProfile(studentMe);

      if (studentMe && studentMe.classId) {
        const ttRes = await api.get('/timetable', {
          params: { classId: studentMe.classId }
        });
        const list = Array.isArray(ttRes) ? ttRes : [];
        setSlots(list);
      }
    } catch (error) {
      console.error('Failed to load student timetable:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const todayKey = useMemo(() => getNow().dayKey, []);

  const todaySlots = useMemo(() => {
    return slots
      .filter((s) => s.day.toLowerCase() === todayKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, todayKey]);

  const activeDaySlots = useMemo(() => {
    return slots
      .filter((s) => s.day.toLowerCase() === selectedDay.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, selectedDay]);

  const ongoingSlot = useMemo(() => {
    return todaySlots.find(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    ) || null;
  }, [todaySlots, currentTime]);

  const nextSlot = useMemo(() => {
    return todaySlots.find((s) => s.startTime > currentTime) || null;
  }, [todaySlots, currentTime]);

  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const getSubjectColor = (subjectName: string | undefined, isBreak: boolean) => {
    if (isBreak) return '#8E8E93'; // Gray for breaks
    if (!subjectName) return '#007AFF';
    
    // Deterministic accent colors
    const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const palette = ['#007AFF', '#FF2D55', '#FF9500', '#AF52DE', '#34C759', '#5856D6', '#5AC8FA'];
    return palette[hash % palette.length];
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header Info */}
      <View style={[styles.headerCard, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.backgroundSelected }]}>
        <View style={styles.headerInfoRow}>
          <View style={styles.classBadge}>
            <Ionicons name="school-outline" size={16} color="#007AFF" />
            <ThemedText style={styles.classBadgeText}>
              Class {profile?.className || 'N/A'}
            </ThemedText>
          </View>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>
            Roll No: {profile?.rollNumber || 'N/A'}
          </ThemedText>
        </View>

        {/* Days Row selector */}
        <View style={styles.daysRow}>
          {DAYS.map((day) => {
            const isActive = selectedDay === day.key;
            return (
              <TouchableOpacity
                key={day.key}
                activeOpacity={0.8}
                onPress={() => setSelectedDay(day.key)}
                style={[
                  styles.dayButton,
                  isActive && { backgroundColor: '#007AFF' },
                  !isActive && { backgroundColor: activeTheme === 'light' ? '#F2F2F7' : '#1C1C1E' }
                ]}
              >
                <ThemedText style={[styles.dayButtonText, { color: isActive ? '#FFF' : colors.text }]}>
                  {day.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Slots List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <TypedFlashList
          data={activeDaySlots}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          estimatedItemSize={80}
          ListHeaderComponent={
            (ongoingSlot || nextSlot) ? (
              <View style={styles.summaryContainer}>
                {ongoingSlot && (
                  <View style={[styles.summaryCard, { backgroundColor: '#34C75915', borderColor: '#34C75940', borderWidth: 1 }]}>
                    <View style={styles.summaryHeader}>
                      <View style={[styles.badge, { backgroundColor: '#34C759' }]}>
                        <ThemedText style={styles.badgeText}>ONGOING CLASS</ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 12, color: '#34C759', fontWeight: 'bold' }}>Now</ThemedText>
                    </View>
                    <ThemedText style={styles.summaryTitle}>
                      {ongoingSlot.subjectName || ongoingSlot.label || 'Class'}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                      <Ionicons name="time-outline" size={13} /> {formatTime(ongoingSlot.startTime)} - {formatTime(ongoingSlot.endTime)}
                      {ongoingSlot.subjectName && `  •  Room ${ongoingSlot.room || 'N/A'}`}
                    </ThemedText>
                    {ongoingSlot.subjectName && (
                      <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                        <Ionicons name="person-outline" size={13} /> {ongoingSlot.teacherName}
                      </ThemedText>
                    )}
                  </View>
                )}

                {nextSlot && (
                  <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSelected, marginTop: ongoingSlot ? 12 : 0 }]}>
                    <View style={styles.summaryHeader}>
                      <View style={[styles.badge, { backgroundColor: '#007AFF' }]}>
                        <ThemedText style={styles.badgeText}>UPCOMING NEXT</ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 12, color: '#007AFF', fontWeight: 'bold' }}>{formatTime(nextSlot.startTime)}</ThemedText>
                    </View>
                    <ThemedText style={styles.summaryTitle}>
                      {nextSlot.subjectName || nextSlot.label || 'Class'}
                    </ThemedText>
                    {nextSlot.subjectName && (
                      <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                        <Ionicons name="person-outline" size={13} /> {nextSlot.teacherName}  •  Room {nextSlot.room || 'N/A'}
                      </ThemedText>
                    )}
                  </View>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#C7C7CC" />
              <ThemedText style={styles.emptyTitle}>No Classes Scheduled</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Enjoy your free day! There are no lectures scheduled for {selectedDay}.
              </ThemedText>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const isBreak = !item.subjectName && !!item.label;
            const isOngoing = !isBreak && todayKey === selectedDay.toLowerCase() && currentTime >= item.startTime && currentTime <= item.endTime;
            const accentColor = isOngoing ? '#34C759' : getSubjectColor(item.subjectName, isBreak);

            return (
              <View style={[
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
              ]}>
                <View style={styles.timeSection}>
                  <ThemedText style={styles.timeText}>{formatTime(item.startTime)}</ThemedText>
                  <ThemedText style={[styles.timeSubtext, { color: colors.textSecondary }]}>to {formatTime(item.endTime)}</ThemedText>
                </View>

                <View style={styles.detailsSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ThemedText style={styles.subjectNameText}>
                      {isBreak ? item.label : item.subjectName}
                    </ThemedText>
                    {isOngoing && (
                      <View style={{ backgroundColor: '#34C75920', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <ThemedText style={{ color: '#34C759', fontSize: 9, fontWeight: 'bold' }}>ONGOING</ThemedText>
                      </View>
                    )}
                  </View>
                  {!isBreak && (
                    <View style={styles.teacherRow}>
                      <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                      <ThemedText style={[styles.teacherText, { color: colors.textSecondary }]}>
                        {item.teacherName || 'Instructor'}
                      </ThemedText>
                    </View>
                  )}
                  {isBreak && (
                    <ThemedText style={[styles.teacherText, { color: colors.textSecondary }]}>
                      Recess / Break Time
                    </ThemedText>
                  )}
                </View>

                <View style={styles.roomSection}>
                  <View style={[styles.roomBadge, { backgroundColor: colors.backgroundSelected }]}>
                    <ThemedText style={[styles.roomText, { color: colors.text }]}>
                      {isBreak ? 'Break' : 'Room ' + (item.room || 'N/A')}
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          }}
        />
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCard: {
    padding: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  classBadgeText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 13,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
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
  slotCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    height: 80,
    alignItems: 'center',
    paddingRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  accentBar: {
    width: 6,
    height: '100%',
  },
  timeSection: {
    width: 85,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  timeSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  detailsSection: {
    flex: 1,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  subjectNameText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teacherText: {
    fontSize: 12,
  },
  roomSection: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  roomBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roomText: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
