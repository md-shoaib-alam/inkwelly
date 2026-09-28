import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RecentNotices } from '@/modules/dashboard/components/RecentNotices';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Skeleton } from '@/components/Skeleton';
import { StudentDashboardSkeleton } from '@/components/ui/StudentDashboardSkeleton';
import type { AppUser, DashboardData, AttendanceRecord, GradeRecord, FeeRecord, HomeworkItem, SubmissionItem, TimetableEntry, StudentProfile, ThemeColors } from '@/types/index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Day map for timetable filtering
const DAY_MAP: Record<number, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
};

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

interface StudentDashboardProps {
  user: AppUser;
  data: DashboardData | null;
  refreshing: boolean;
  onRefresh: () => void;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  route: string;
  index: number;
  isDark: boolean;
  colors: ThemeColors;
}

// ── Attendance Ring ────────────────────────────────────────────────
function AttendanceRing({ pct, color }: { pct: number; color: string }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ - (pct / 100) * circ;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* SVG-like ring drawn with View borders */}
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: color + '25',
        position: 'absolute',
      }} />
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke,
        borderColor: 'transparent',
        borderTopColor: color,
        borderRightColor: pct > 25 ? color : 'transparent',
        borderBottomColor: pct > 50 ? color : 'transparent',
        borderLeftColor: pct > 75 ? color : 'transparent',
        position: 'absolute',
        transform: [{ rotate: '-90deg' }],
      }} />
      <ThemedText style={{ fontSize: 13, fontWeight: '800', color }}>{pct}%</ThemedText>
    </View>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, route, index, isDark, colors }: StatCardProps) {
  const scale = useMemo(() => new Animated.Value(1), []);
  const router = useRouter();

  const onPressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.statCardOuter]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => router.push(route as any)}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={isDark ? ['#1E2235', '#252A3D'] : ['#FFFFFF', '#F4F8FF']}
          style={[styles.statCard, {
            borderColor: isDark ? '#2C3250' : color + '25',
          }]}
        >
          <View style={styles.statIconRow}>
            <View style={[styles.statIconBg, { backgroundColor: color + '18' }]}>
              <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <Ionicons name="chevron-forward-outline" size={13} color={colors.textSecondary} />
          </View>
          <ThemedText style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
            {value}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            {label}
          </ThemedText>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Quick Action Pill ──────────────────────────────────────────────
interface ActionPillProps {
  icon: string;
  label: string;
  color: string;
  route: string;
}

function ActionPill({ icon, label, color, route }: ActionPillProps) {
  const router = useRouter();
  const scale = useMemo(() => new Animated.Value(1), []);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => router.push(route as any)}
        style={[styles.actionPill, { backgroundColor: color + '14' }]}
      >
        <View style={[styles.actionPillIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <ThemedText style={[styles.actionPillLabel, { color }]}>{label}</ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export function StudentDashboard({ user, data, refreshing, onRefresh }: StudentDashboardProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const shimmerAnim = useMemo(() => new Animated.Value(0), []);
  // Compute greeting per mount so it doesn't get stale across day boundaries
  const greeting = useMemo(() => getGreeting(), []);
  // Track component mount state to prevent setState on unmounted component
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ attendance: '—', homework: '—', grade: '—', fees: '—' });
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchStudentData = useCallback(async () => {
    try {
      const studentMe = await api.get<StudentProfile>('/students/me');
      if (!isMountedRef.current) return;
      setProfile(studentMe);

      if (studentMe?.id) {
        const [attRes, hwRes, subRes, feeRes, gradeRes, ttRes] = await Promise.all([
          api.get('/attendance', { params: { studentId: studentMe.id, limit: '1000' } }).catch(() => ({ records: [] })),
          api.get('/homework', { params: { classId: studentMe.classId } }).catch(() => []),
          api.get('/submissions', { params: { studentId: studentMe.id } }).catch(() => ({ data: [] })),
          api.get('/fees', { params: { studentId: studentMe.id } }).catch(() => []),
          api.get('/grades', { params: { studentId: studentMe.id } }).catch(() => []),
          api.get('/timetable', { params: { classId: studentMe.classId } }).catch(() => []),
        ]);

        if (!isMountedRef.current) return;

        const records: AttendanceRecord[] = Array.isArray((attRes as { records?: AttendanceRecord[] }).records)
          ? (attRes as { records: AttendanceRecord[] }).records
          : [];
        const myAtt = records.filter((r) => r.studentId === studentMe.id);
        const present = myAtt.filter((r) =>
          r.status === 'present' || r.status === 'late' ||
          r.status === 'half-day' || r.status === 'half_day'
        ).length;
        const rate = myAtt.length > 0 ? Math.round((present / myAtt.length) * 100) : 100;

        const homeworkList: HomeworkItem[] = Array.isArray(hwRes) ? (hwRes as HomeworkItem[]) : [];
        const rawSubs = Array.isArray((subRes as { data?: SubmissionItem[] }).data)
          ? (subRes as { data: SubmissionItem[] }).data
          : Array.isArray(subRes) ? (subRes as SubmissionItem[]) : [];
        const subMap = new Set(rawSubs.map((s) => s.assignmentId));
        const pendingHw = homeworkList.filter((h) => !subMap.has(h.id)).length;

        const gradeList: GradeRecord[] = Array.isArray(gradeRes) ? (gradeRes as GradeRecord[]) : [];
        const avgPct = gradeList.length > 0
          ? Math.round(gradeList.reduce((acc, curr) => acc + ((curr.marks / curr.maxMarks) * 100), 0) / gradeList.length)
          : 0;
        let letter = 'N/A';
        if (gradeList.length > 0) {
          if (avgPct >= 90) letter = 'A+';
          else if (avgPct >= 80) letter = 'A';
          else if (avgPct >= 70) letter = 'B';
          else if (avgPct >= 60) letter = 'C';
          else if (avgPct >= 50) letter = 'D';
          else letter = 'F';
        }

        const feesList: FeeRecord[] = Array.isArray(feeRes) ? (feeRes as FeeRecord[]) : [];
        const pendingFee = feesList
          .filter((f) => f.status !== 'paid')
          .reduce((acc, curr) => acc + (curr.amount - curr.paidAmount), 0);

        setStats({
          attendance: `${rate}%`,
          homework: String(pendingHw),
          grade: gradeList.length > 0 ? `${letter} · ${avgPct}%` : 'N/A',
          fees: `₹${pendingFee.toLocaleString()}`,
        });

        const timetableList: TimetableEntry[] = Array.isArray(ttRes) ? (ttRes as TimetableEntry[]) : [];
        setTodayClasses(
          timetableList
            .filter((t) => t.day.toLowerCase() === DAY_MAP[new Date().getDay()])
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
        );
      }
    } catch (e) {
      if (isMountedRef.current) {
        console.error('Student dashboard error:', e);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStudentData(); }, [fetchStudentData]);

  // handleRefresh: parent's onRefresh handles data invalidation; we just re-fetch our own data
  const handleRefresh = useCallback(async () => {
    onRefresh();
  }, [onRefresh]);

  const studentStats = useMemo(() => [
    { label: 'Attendance', value: stats.attendance, icon: 'calendar-outline', color: '#34C759', route: '/(student)/(tabs)/attendance' },
    { label: 'Pending HW', value: stats.homework, icon: 'book-outline', color: '#FF9500', route: '/(student)/(tabs)/homework' },
    { label: 'Grade', value: stats.grade, icon: 'ribbon-outline', color: '#007AFF', route: '/(student)/(tabs)/report-card' },
    { label: 'Fees Due', value: stats.fees, icon: 'wallet-outline', color: '#FF2D55', route: '/(student)/(tabs)/fees' },
  ], [stats]);

  const quickActions = useMemo(() => [
    { label: 'Attendance', icon: 'checkbox-outline', color: '#34C759', route: '/(student)/(tabs)/attendance' },
    { label: 'Homework', icon: 'document-text-outline', color: '#AF52DE', route: '/(student)/(tabs)/homework' },
    { label: 'Report Cards', icon: 'ribbon-outline', color: '#FF2D55', route: '/(student)/(tabs)/report-card' },
    { label: 'Assessments', icon: 'clipboard-outline', color: '#007AFF', route: '/(student)/(tabs)/assessments' },
    { label: 'Leaves', icon: 'calendar-outline', color: '#FF9500', route: '/(student)/(tabs)/leaves' },
    { label: 'Notices', icon: 'megaphone-outline', color: '#34C759', route: '/(admin)/(tabs)/notices' },
    { label: 'Tickets', icon: 'ticket-outline', color: '#5856D6', route: '/(student)/(tabs)/tickets' },
  ], []);
  const accentPalette = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5856D6', '#5AC8FA'];

  if (loading && !refreshing) {
    return <StudentDashboardSkeleton />;
  }

  const name = profile?.name || user?.name || 'Student';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} tintColor={colors.textSecondary} />
        }
      >
        {/* ── STUDENT CARD ─────────────────────────────────────── */}
        <View
          style={{ 
            borderRadius: 20,
            backgroundColor: isDark ? '#1E212C' : undefined,
            shadowColor: '#000000',
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
            borderWidth: 1.5,
            borderColor: isDark ? '#2E313D' : '#0066D6',
            marginHorizontal: 16,
            marginTop: 16,
            paddingVertical: 22,
            paddingHorizontal: 20,
            overflow: 'hidden',
          }}
        >
          {/* Card Background Gradient in Light Mode */}
          {!isDark && (
            <LinearGradient
              colors={['#007AFF', '#0056B3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: [{ translateX: shimmerTranslateX }],
            }}
          >
            <LinearGradient
              colors={isDark 
                ? ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0)'] 
                : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.wardLabel, { color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.7)' }]}>
                STUDENT PROFILE
              </ThemedText>
              <ThemedText style={[styles.wardName, { color: isDark ? colors.text : '#FFFFFF' }]} numberOfLines={1}>
                {name}
              </ThemedText>
            </View>
            {profile?.avatar ? (
              <Image 
                source={{ uri: profile.avatar }} 
                style={[
                  styles.childAvatarImg,
                  { borderColor: isDark ? '#2E313D' : '#FFFFFF' }
                ]}
              />
            ) : (
              <View style={[
                styles.childAvatarFallback,
                {
                  backgroundColor: isDark ? '#2A2E3D' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: isDark ? '#3D4457' : 'rgba(255, 255, 255, 0.3)',
                }
              ]}>
                <ThemedText style={{ fontSize: 18, fontWeight: '800', color: isDark ? '#FFFFFF' : '#007AFF' }}>
                  {(profile?.name || user?.name || 'S').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={[styles.cardDivider, { backgroundColor: isDark ? '#2E313D' : 'rgba(255, 255, 255, 0.15)' }]} />

          <View style={styles.cardBottomRow}>
            <View style={styles.cardCol}>
              <ThemedText style={[styles.cardColLabel, { color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.7)' }]}>
                Class & Section
              </ThemedText>
              <ThemedText style={[styles.cardColVal, { color: isDark ? colors.text : '#FFFFFF' }]}>
                {profile?.className || 'Class N/A'}
              </ThemedText>
            </View>
            <View style={[styles.cardCol, { alignItems: 'flex-end' }]}>
              <ThemedText style={[styles.cardColLabel, { color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.7)' }]}>
                Roll Number
              </ThemedText>
              <ThemedText style={[styles.cardColVal, { color: isDark ? colors.text : '#FFFFFF' }]}>
                {profile?.rollNumber || 'N/A'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* ── STAT CARDS ──────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {studentStats.map((s, i) => (
            <StatCard key={i} {...s} index={i} isDark={isDark} colors={colors} />
          ))}
        </View>
        {/* ── QUICK ACTIONS ───────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Quick Access</ThemedText>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.quickActionsScroll}
          style={{ marginBottom: 8 }}
        >
          {quickActions.map((a, i) => (
            <ActionPill key={i} {...a} />
          ))}
        </ScrollView>

        {/* ── TODAY'S SCHEDULE ────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{"Today's Schedule"}</ThemedText>
          <ThemedText style={[styles.sectionSub, { color: colors.textSecondary }]}>
            {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'}
          </ThemedText>
        </View>

        <View style={[styles.scheduleCard, {
          backgroundColor: isDark ? '#1A1E2E' : '#FFFFFF',
          borderColor: isDark ? '#252A3D' : '#E8F0FE',
        }]}>
          {todayClasses.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={isDark ? ['#1E2640', '#151929'] : ['#EEF4FF', '#E0ECFF']}
                style={styles.emptyIcon}
              >
                <Ionicons name="sunny-outline" size={32} color="#007AFF" />
              </LinearGradient>
              <ThemedText style={{ marginTop: 12, fontWeight: '600', color: colors.text }}>
                Free Day!
              </ThemedText>
              <ThemedText style={{ marginTop: 4, fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                No classes scheduled for today.
              </ThemedText>
            </View>
          ) : (
            todayClasses.map((slot, i) => {
              const isBreak = !slot.subjectName && !!slot.label;
              const isOngoing = !isBreak && currentTime >= slot.startTime && currentTime <= slot.endTime;
              const hash = ((isBreak ? slot.label : slot.subjectName) || '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
              const accent = isOngoing ? '#34C759' : (isBreak ? '#8E8E93' : accentPalette[hash % accentPalette.length]);
              const isLast = i === todayClasses.length - 1;

              return (
                <View key={slot.id}>
                  <View style={styles.slotRow}>
                    {/* Timeline dot + line */}
                    <View style={styles.timelineCol}>
                      <View style={[
                        styles.timelineDot, 
                        { backgroundColor: accent },
                        isOngoing && {
                          shadowColor: '#34C759',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 4,
                        }
                      ]} />
                      {!isLast && <View style={[styles.timelineLine, { backgroundColor: isDark ? '#252A3D' : '#E8F0FE' }]} />}
                    </View>

                    {/* Time */}
                    <View style={styles.timeCol}>
                      <ThemedText style={[styles.slotTime, { color: isOngoing ? '#34C759' : colors.text, fontWeight: isOngoing ? '800' : '700' }]}>{slot.startTime}</ThemedText>
                      <ThemedText style={[styles.slotTimeEnd, { color: colors.textSecondary }]}>{slot.endTime}</ThemedText>
                    </View>

                    {/* Info card */}
                    <View style={[
                      styles.slotInfo, 
                      {
                        backgroundColor: isDark ? '#21263A' : accent + '08',
                      },
                      isOngoing && {
                        borderColor: '#34C759',
                        borderWidth: 1.5,
                        backgroundColor: isDark ? '#142918' : '#F0FFF4',
                      }
                    ]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <ThemedText style={[styles.slotSubject, { color: colors.text, marginBottom: 0 }]}>
                          {isBreak ? slot.label : (slot.subjectName || 'Regular Class')}
                        </ThemedText>
                        {isOngoing && (
                          <View style={{ backgroundColor: '#34C75920', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <ThemedText style={{ color: '#34C759', fontSize: 9, fontWeight: 'bold' }}>ONGOING</ThemedText>
                          </View>
                        )}
                      </View>
                      <View style={styles.slotMeta}>
                        {!isBreak ? (
                          <View style={styles.slotMetaItem}>
                            <Ionicons name="person-outline" size={10} color={colors.textSecondary} />
                            <ThemedText style={[styles.slotMetaText, { color: colors.textSecondary }]}>
                              {slot.teacherName || 'Instructor'}
                            </ThemedText>
                          </View>
                        ) : (
                          <View style={styles.slotMetaItem}>
                            <Ionicons name="cafe-outline" size={10} color={colors.textSecondary} />
                            <ThemedText style={[styles.slotMetaText, { color: colors.textSecondary }]}>
                              Recess / Break Time
                            </ThemedText>
                          </View>
                        )}
                        <View style={[styles.roomBadge, { backgroundColor: isBreak ? (isDark ? '#2C2C2E' : '#F2F2F7') : accent + '18' }]}>
                          <ThemedText style={[styles.roomText, { color: isBreak ? '#8E8E93' : accent }]}>
                            {isBreak ? 'Break' : `Room ${slot.room || 'N/A'}`}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── RECENT NOTICES ──────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Notices</ThemedText>
        </View>
        <RecentNotices data={data?.recentNotices || []} />

        <View style={{ height: 36 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 20 },

  // Hero
  hero: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    paddingBottom: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#1C6EF2',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  greetLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  heroName: { fontSize: 22, fontWeight: '500', color: '#FFFFFF', letterSpacing: -0.2 },
  classLabel: { fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', fontWeight: '400', marginTop: 4 },
  rollLabel: { fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', fontWeight: '400', marginTop: 2 },
  schoolPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  schoolPillText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)' },
  avatarFallback: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  heroPillsRow: { flexDirection: 'row', gap: 8 },
  heroPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingVertical: 7,
  },
  heroPillText: { fontSize: 11, color: '#FFF', fontWeight: '700' },

  // Stat cards
  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, marginTop: 16,
  },
  statCardOuter: { width: (SCREEN_WIDTH - 44) / 2 },
  statCard: {
    borderRadius: 18, padding: 14, borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 3, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  statIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  statIconBg: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 3 },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionSub: { fontSize: 13, fontWeight: '500', marginLeft: 'auto' },
  sectionBadge: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },

  // Quick actions
  pillsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16,
  },
  quickActionsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 50,
  },
  actionPillIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionPillLabel: { fontSize: 13, fontWeight: '700' },

  // Schedule
  scheduleCard: {
    marginHorizontal: 16, borderRadius: 20, padding: 16,
    borderWidth: 1.5, elevation: 2,
    shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  slotRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  timelineCol: { width: 20, alignItems: 'center', paddingTop: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 2, flex: 1, marginTop: 4, minHeight: 30 },
  timeCol: { width: 52, paddingTop: 2, marginRight: 10 },
  slotTime: { fontSize: 13, fontWeight: '800' },
  slotTimeEnd: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  slotInfo: {
    flex: 1, borderRadius: 12, padding: 10,
    marginBottom: 10,
  },
  slotSubject: { fontSize: 14, fontWeight: '700', marginBottom: 5 },
  slotMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slotMetaText: { fontSize: 11 },
  roomBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  roomText: { fontSize: 10, fontWeight: '700' },
  wardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  wardName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  childAvatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
  },
  childAvatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    marginTop: 10,
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCol: {
    flex: 1,
  },
  cardColLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardColVal: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
});
