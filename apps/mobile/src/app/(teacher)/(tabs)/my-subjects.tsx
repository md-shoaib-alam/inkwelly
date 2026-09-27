import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, RefreshControl, ScrollView, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
const TypedFlashList = FlashList as any;

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  className: string;
  classId: string;
  teacherName: string;
  teacherId: string;
}

interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectId: string;
}

const PALETTES = [
  { bg: '#007AFF15', color: '#007AFF', border: '#007AFF30' },
  { bg: '#34C75915', color: '#34C759', border: '#34C75930' },
  { bg: '#FF950015', color: '#FF9500', border: '#FF950030' },
  { bg: '#AF52DE15', color: '#AF52DE', border: '#AF52DE30' },
  { bg: '#FF2D5515', color: '#FF2D55', border: '#FF2D5530' },
  { bg: '#5856D615', color: '#5856D6', border: '#5856D630' },
];

function getPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export default function MySubjectsScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();
  const isLargeDevice = width >= 768;

  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubjectsAndTimetable = useCallback(async () => {
    try {
      const resSubjects = await api.get('/subjects?mine=true');
      const assignedSubjects: SubjectInfo[] = Array.isArray(resSubjects) ? resSubjects : [];

      const resTimetable = await api.get('/timetable?mine=true');
      const timetableList: any[] = Array.isArray(resTimetable) ? resTimetable : [];
      setTimetable(timetableList);

      // Extract unique subjects from timetable slots
      const timetableSubjects: SubjectInfo[] = [];
      const seen = new Set<string>();
      timetableList.forEach((t) => {
        if (t.subjectId && t.subjectName) {
          const key = `${t.subjectId}-${t.classId}`;
          if (!seen.has(key)) {
            seen.add(key);
            timetableSubjects.push({
              id: t.subjectId,
              name: t.subjectName,
              code: t.subjectCode || '',
              className: t.className || 'Class',
              classId: t.classId || '',
              teacherName: t.teacherName || '',
              teacherId: t.teacherId || '',
            });
          }
        }
      });

      // Combine both lists
      const combined = [...assignedSubjects];
      const seenCombined = new Set(assignedSubjects.map(s => `${s.id}-${s.classId}`));
      timetableSubjects.forEach((ts) => {
        const key = `${ts.id}-${ts.classId}`;
        if (!seenCombined.has(key)) {
          seenCombined.add(key);
          combined.push(ts);
        }
      });

      setSubjects(combined);
    } catch (error) {
      console.error('Failed to fetch subjects or timetable:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjectsAndTimetable();
  }, [fetchSubjectsAndTimetable]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubjectsAndTimetable();
  };

  const getTimetableForSubject = (subjectId: string) => {
    return timetable.filter(slot => slot.subjectId === subjectId);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH}:${minutes} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  const uniqueClassesCount = useMemo(() => {
    const classes = new Set(subjects.map(s => s.className));
    return classes.size;
  }, [subjects]);

  const renderHeader = () => {
    if (subjects.length === 0) return null;
    return (
      <View style={styles.headerContainer}>
        <View style={[styles.headerCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.headerIconBg, { backgroundColor: '#007AFF15' }]}>
              <Ionicons name="sparkles" size={20} color="#007AFF" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <ThemedText style={styles.headerTitle}>Subject Overview</ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>You are instructing active subjects</ThemedText>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <ThemedText style={[styles.statValue, { color: colors.text }]}>{subjects.length}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Total Subjects</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.backgroundSelected }]} />
            <View style={styles.statCol}>
              <ThemedText style={[styles.statValue, { color: colors.text }]}>{uniqueClassesCount}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Total Classes</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.backgroundSelected }]} />
            <View style={styles.statCol}>
              <ThemedText style={[styles.statValue, { color: colors.text }]}>{timetable.length}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Weekly Slots</ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <TypedFlashList
          data={subjects}
          keyExtractor={(item: SubjectInfo, index: number) => `${item.id}-${item.classId}-${index}`}
          contentContainerStyle={styles.listContent}
          estimatedItemSize={180}
          numColumns={isLargeDevice ? 2 : 1}
          key={isLargeDevice ? 'two-columns' : 'one-column'}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.backgroundSelected }]}>
                <Ionicons name="book-outline" size={48} color="#007AFF" />
              </View>
              <ThemedText style={styles.emptyTitle}>No Subjects Found</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Ask your school administrator to assign subjects to you in the timetable.
              </ThemedText>
            </View>
          }
          renderItem={({ item }: { item: SubjectInfo }) => {
            const p = getPalette(item.name);
            const slots = getTimetableForSubject(item.id);
            return (
              <View 
                style={[
                  styles.card, 
                  { 
                    backgroundColor: colors.backgroundElement, 
                    borderColor: colors.backgroundSelected,
                    flex: 1,
                    marginHorizontal: isLargeDevice ? 8 : 0,
                  }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrapper, { backgroundColor: p.bg, borderColor: p.border }]}>
                    <Ionicons name="book" size={20} color={p.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText style={styles.subjectName}>{item.name}</ThemedText>
                    {item.code ? (
                      <View style={[styles.codeBadge, { backgroundColor: colors.backgroundSelected }]}>
                        <ThemedText style={[styles.codeText, { color: colors.textSecondary }]}>
                          {item.code}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Class association badge */}
                <View style={styles.classRow}>
                  <View style={[styles.badge, { backgroundColor: colors.backgroundSelected, borderColor: colors.backgroundSelected }]}>
                    <Ionicons name="school-outline" size={14} color="#007AFF" style={{ marginRight: 6 }} />
                    <ThemedText style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                      {item.className}
                    </ThemedText>
                  </View>
                </View>

                {/* Timings with Horizontal Scroll View */}
                {slots.length > 0 && (
                  <View style={[styles.timingSection, { borderTopColor: colors.backgroundSelected }]}>
                    <ThemedText style={[styles.timingLabel, { color: colors.textSecondary }]}>WEEKLY TIMETABLE SLOTS</ThemedText>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalScrollContent}
                    >
                      {slots.map((slot) => (
                        <View 
                          key={slot.id} 
                          style={[
                            styles.slotBadge, 
                            { 
                              backgroundColor: colors.backgroundSelected, 
                              borderColor: colors.backgroundSelected 
                            }
                          ]}
                        >
                          <View style={[styles.dayChip, { backgroundColor: p.bg }]}>
                            <ThemedText style={[styles.slotDay, { color: p.color }]}>
                              {slot.day.substring(0, 3).toUpperCase()}
                            </ThemedText>
                          </View>
                          <View style={styles.timeInfo}>
                            <Ionicons name="time-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                            <ThemedText style={[styles.timeText, { color: colors.textSecondary }]}>
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </ThemedText>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  classRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  timingSection: {
    borderTopWidth: 1,
    paddingTop: 14,
  },
  timingLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  horizontalScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  dayChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  slotDay: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
