import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Palette } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';

import { AttendanceRecordItem } from '@/modules/attendance/components/teacherMyAttendance/types';
import {
  formatLocalDate,
  calculateAttendanceMetrics,
  MONTH_NAMES,
} from '@/modules/attendance/components/teacherMyAttendance/utils';
import { MonthlyMetricCards } from '@/modules/attendance/components/teacherMyAttendance/MonthlyMetricCards';
import { AttendanceCalendar } from '@/modules/attendance/components/teacherMyAttendance/AttendanceCalendar';
import { TodayAttendanceCard } from '@/modules/attendance/components/teacherMyAttendance/TodayAttendanceCard';
import { AttendanceBreakdownCard } from '@/modules/attendance/components/teacherMyAttendance/AttendanceBreakdownCard';
import { RecentAttendanceList } from '@/modules/attendance/components/teacherMyAttendance/RecentAttendanceList';
import { AttendanceHistoryModal } from '@/modules/attendance/components/teacherMyAttendance/AttendanceHistoryModal';
import { AttendanceSkeleton } from '@/modules/attendance/components/teacherMyAttendance/AttendanceSkeleton';
import { TeacherQRScanModal } from '@/modules/attendance/components/TeacherQRScanModal';

export default function TeacherMyAttendanceScreen() {
  const router = useRouter();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Anchored strictly to real current month
  const now = useMemo(() => new Date(), []);
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth(); // 0-indexed
  const currentMonthStr = useMemo(() => {
    return `${currentRealYear}-${String(currentRealMonth + 1).padStart(2, '0')}`;
  }, [currentRealYear, currentRealMonth]);

  const daysInCurrentMonth = useMemo(() => {
    return new Date(currentRealYear, currentRealMonth + 1, 0).getDate();
  }, [currentRealYear, currentRealMonth]);

  // Real local today string: YYYY-MM-DD in IST
  const todayStr = useMemo(() => formatLocalDate(now), [now]);

  // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalDate(new Date()));

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const calMonthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;

  // Current month's real records
  const [currentMonthRecords, setCurrentMonthRecords] = useState<AttendanceRecordItem[]>([]);
  // Calendar's records (matches currentMonthRecords when viewing current month)
  const [calendarRecords, setCalendarRecords] = useState<AttendanceRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [viewAllModalOpen, setViewAllModalOpen] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);

  // Re-visiting the screen shouldn't re-hit the API every time. Within this
  // window a focus just reuses what's already on screen; pull-to-refresh,
  // check-in and QR scan all pass force=true to bypass it.
  const STALE_MS = 60 * 1000;
  const lastFetchedAtRef = useRef(0);
  const fetchedKeyRef = useRef<string>('');

  // Fetch Current Month Attendance strictly for the summary cards
  const fetchCurrentMonthAttendance = useCallback(
    async (force = false) => {
      const key = `${user?.id ?? ''}|${currentMonthStr}`;
      const isFresh =
        fetchedKeyRef.current === key && Date.now() - lastFetchedAtRef.current < STALE_MS;
      if (isFresh && !force) return;
      try {
        const userId = user?.id;
        const res = await api.get('/staff-attendance', {
          params: { month: currentMonthStr, ...(userId ? { userId } : {}) },
        });
        const list: AttendanceRecordItem[] = Array.isArray(res) ? res : [];
        const userRecords = userId ? list.filter((r) => !r.userId || r.userId === userId) : list;
        setCurrentMonthRecords(userRecords);
      } catch {
        // Keep previous state
      } finally {
        lastFetchedAtRef.current = Date.now();
        fetchedKeyRef.current = key;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentMonthStr, user?.id]
  );

  // Initial load & focus effect — focus only refetches when the data is stale
  useFocusEffect(
    useCallback(() => {
      fetchCurrentMonthAttendance();
    }, [fetchCurrentMonthAttendance])
  );

  // Fetch Calendar Month Attendance only when browsing different calendar months
  useEffect(() => {
    if (calMonthStr === currentMonthStr) {
      return;
    }
    let isCancelled = false;
    const fetchCalendar = async () => {
      try {
        const userId = user?.id;
        const res = await api.get('/staff-attendance', {
          params: { month: calMonthStr, ...(userId ? { userId } : {}) },
        });
        const list: AttendanceRecordItem[] = Array.isArray(res) ? res : [];
        const userRecords = userId ? list.filter((r) => !r.userId || r.userId === userId) : list;
        if (!isCancelled) setCalendarRecords(userRecords);
      } catch {
        if (!isCancelled) setCalendarRecords([]);
      }
    };
    fetchCalendar();
    return () => {
      isCancelled = true;
    };
  }, [calMonthStr, currentMonthStr, user?.id]);

  const activeCalendarRecords = useMemo(() => {
    return calMonthStr === currentMonthStr ? currentMonthRecords : calendarRecords;
  }, [calMonthStr, currentMonthStr, currentMonthRecords, calendarRecords]);

  // Month navigation for interactive calendar
  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setSelectedDate(formatLocalDate(today));
  };

  // Metrics strictly for Current Month (matching school-web calculation)
  const currentMonthMetrics = useMemo(() => {
    return calculateAttendanceMetrics(currentMonthRecords, daysInCurrentMonth);
  }, [currentMonthRecords, daysInCurrentMonth]);

  // Today's record
  const todayRecord = useMemo(() => {
    const userId = user?.id;
    return (
      currentMonthRecords.find(
        (r) => r.date === todayStr && (!userId || !r.userId || r.userId === userId)
      ) || null
    );
  }, [currentMonthRecords, todayStr, user?.id]);

  // Tabs state: 'today' | 'calendar' | 'history'
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'history'>('today');
  const { width: screenWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth > 0 ? (containerWidth - 8) / 3 : Math.max(0, (screenWidth - 40) / 3);

  const horizontalScrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const indicatorTranslateX = scrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2],
    outputRange: [0, tabWidth, tabWidth * 2],
    extrapolate: 'clamp',
  });

  const handleTabPress = useCallback(
    (index: number, tab: 'today' | 'calendar' | 'history') => {
      setActiveTab(tab);
      horizontalScrollRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    },
    [screenWidth]
  );

  // Full month sorted records for History tab
  const allMonthRecords = useMemo(() => {
    return [...currentMonthRecords].sort((a, b) => b.date.localeCompare(a.date));
  }, [currentMonthRecords]);

  // Self check-out handler
  const handleCheckInToggle = async () => {
    setIsCheckingIn(true);
    try {
      const res: any = await api.post('/staff-attendance/check-in', { date: todayStr });
      if (res?.success) {
        Alert.alert('Checked Out', 'Your working hours for today are finalized.');
        await fetchCurrentMonthAttendance(true);
      } else {
        Alert.alert('Check Out Failed', res?.message || res?.error || 'Could not record check-out.');
      }
    } catch (err: any) {
      Alert.alert('Check Out Failed', err?.message || 'Could not record check-out.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCurrentMonthAttendance(true);
  };

  const hasCheckedIn = Boolean(todayRecord?.checkIn);

  return (
    <ThemedView style={styles.container}>
      {/* ── Standard Simple Tab Header (Matching other tabs) ── */}
      <View
        style={[
          styles.standardHeader,
          {
            backgroundColor: colors.background,
            borderBottomColor: isDark ? '#2C2C2E' : '#E5E5E5',
            paddingTop: insets.top + 6,
          },
        ]}
      >
        <View style={styles.standardHeaderRow}>
          {router.canGoBack() ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backButton,
                { backgroundColor: isDark ? '#2E3135' : '#E0E1E6' },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}

          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            My Attendance
          </ThemedText>

          {/* Spacer to keep center title balanced */}
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* ── 3 Tabs Switcher: Today | Calendar | History ── */}
      <View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setContainerWidth(w);
        }}
        style={[
          styles.tabContainer,
          {
            backgroundColor: isDark ? '#18181B' : '#F1F5F9',
            borderColor: isDark ? '#27272A' : '#E2E8F0',
          },
        ]}
      >
        {/* Smooth Sliding Pill Indicator */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.activeTabIndicator,
              {
                width: tabWidth,
                transform: [{ translateX: indicatorTranslateX }],
                backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              },
            ]}
          />
        )}

        {/* Tab 1: Today */}
        <TouchableOpacity
          onPress={() => handleTabPress(0, 'today')}
          style={styles.tabBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'today' ? 'today' : 'today-outline'}
            size={16}
            color={
              activeTab === 'today'
                ? isDark
                  ? '#60A5FA'
                  : '#2563EB'
                : colors.textSecondary
            }
          />
          <ThemedText
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'today'
                    ? isDark
                      ? '#60A5FA'
                      : '#2563EB'
                    : colors.textSecondary,
                fontWeight: activeTab === 'today' ? '700' : '600',
              },
            ]}
          >
            Today
          </ThemedText>
        </TouchableOpacity>

        {/* Tab 2: Calendar */}
        <TouchableOpacity
          onPress={() => handleTabPress(1, 'calendar')}
          style={styles.tabBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'calendar' ? 'calendar' : 'calendar-outline'}
            size={16}
            color={
              activeTab === 'calendar'
                ? isDark
                  ? '#60A5FA'
                  : '#2563EB'
                : colors.textSecondary
            }
          />
          <ThemedText
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'calendar'
                    ? isDark
                      ? '#60A5FA'
                      : '#2563EB'
                    : colors.textSecondary,
                fontWeight: activeTab === 'calendar' ? '700' : '600',
              },
            ]}
          >
            Calendar
          </ThemedText>
        </TouchableOpacity>

        {/* Tab 3: History */}
        <TouchableOpacity
          onPress={() => handleTabPress(2, 'history')}
          style={styles.tabBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'history' ? 'receipt' : 'receipt-outline'}
            size={16}
            color={
              activeTab === 'history'
                ? isDark
                  ? '#60A5FA'
                  : '#2563EB'
                : colors.textSecondary
            }
          />
          <ThemedText
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'history'
                    ? isDark
                      ? '#60A5FA'
                      : '#2563EB'
                    : colors.textSecondary,
                fontWeight: activeTab === 'history' ? '700' : '600',
              },
            ]}
          >
            History
          </ThemedText>
          {allMonthRecords.length > 0 && (
            <View
              style={[
                styles.tabBadge,
                {
                  backgroundColor:
                    activeTab === 'history'
                      ? isDark
                        ? 'rgba(96,165,250,0.18)'
                        : '#EFF6FF'
                      : isDark
                      ? '#27272A'
                      : '#E2E8F0',
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.tabBadgeText,
                  {
                    color:
                      activeTab === 'history'
                        ? isDark
                          ? '#60A5FA'
                          : '#2563EB'
                        : colors.textSecondary,
                  },
                ]}
              >
                {allMonthRecords.length}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Sliding Content Body (Horizontal Pager) ── */}
      {loading && !refreshing ? (
        <AttendanceSkeleton activeTab={activeTab} />
      ) : (
        <Animated.ScrollView
          ref={horizontalScrollRef as any}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e) => {
            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            const tabs: ('today' | 'calendar' | 'history')[] = ['today', 'calendar', 'history'];
            if (tabs[pageIndex] && tabs[pageIndex] !== activeTab) {
              setActiveTab(tabs[pageIndex]);
            }
          }}
          style={{ flex: 1 }}
        >
          {/* ── TAB 1 PAGE: TODAY ATTENDANCE ── */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[Palette.brandBlue]}
                />
              }
            >
              <TodayAttendanceCard
                todayRecord={todayRecord}
                isCheckingIn={isCheckingIn}
                onCheckInToggle={handleCheckInToggle}
                onOpenQRScan={() => setScanVisible(true)}
                metrics={currentMonthMetrics}
              />
              <AttendanceBreakdownCard
                metrics={currentMonthMetrics}
              />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>

          {/* ── TAB 2 PAGE: CALENDAR & MONTHLY METRICS ── */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[Palette.brandBlue]}
                />
              }
            >
              <MonthlyMetricCards
                metrics={currentMonthMetrics}
              />

              <AttendanceCalendar
                calYear={calYear}
                calMonth={calMonth}
                todayStr={todayStr}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onGoToday={handleGoToday}
                calendarRecords={activeCalendarRecords}
              />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>

          {/* ── TAB 3 PAGE: ATTENDANCE HISTORY LOGS ── */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[Palette.brandBlue]}
                />
              }
            >
              <RecentAttendanceList
                recentRecords={allMonthRecords}
                currentRealMonth={currentRealMonth}
                currentRealYear={currentRealYear}
                onSelectDate={setSelectedDate}
                onOpenViewAll={() => setViewAllModalOpen(false)}
                title="Attendance History"
                showViewAll={false}
              />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Animated.ScrollView>
      )}

      {/* ── View All Attendance History Modal ── */}
      <AttendanceHistoryModal
        visible={viewAllModalOpen}
        onClose={() => setViewAllModalOpen(false)}
        currentRealMonth={currentRealMonth}
        currentRealYear={currentRealYear}
        currentMonthRecords={currentMonthRecords}
      />

      {/* ── Full Screen QR Scanner ── */}
      <TeacherQRScanModal
        visible={scanVisible}
        onClose={() => setScanVisible(false)}
        todayMarked={hasCheckedIn}
        todayCheckIn={todayRecord?.checkIn ?? null}
        onScanned={() => fetchCurrentMonthAttendance(true)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  standardHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  standardHeaderRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  tabContainer: {
    position: 'relative',
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeTabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 9,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
    zIndex: 1,
  },
  tabBtnActive: {},
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 2,
  },
  tabBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
