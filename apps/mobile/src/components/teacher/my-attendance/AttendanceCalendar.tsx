import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { AttendanceRecordItem } from './types';
import { MONTH_NAMES, generateCalendarGrid } from './utils';

interface AttendanceCalendarProps {
  calYear: number;
  calMonth: number;
  todayStr: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
  calendarRecords: AttendanceRecordItem[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AttendanceCalendar({
  calYear,
  calMonth,
  todayStr,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  calendarRecords,
}: AttendanceCalendarProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const calendarDays = useMemo(() => {
    return generateCalendarGrid(calYear, calMonth, calendarRecords);
  }, [calYear, calMonth, calendarRecords]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderColor: isDark ? '#27272A' : '#E2E8F0',
        },
      ]}
    >
      {/* Calendar Header Controls */}
      <View
        style={[
          styles.headerRow,
          { borderBottomColor: isDark ? '#27272A' : '#F1F5F9' },
        ]}
      >
        <ThemedText style={[styles.monthTitle, { color: colors.text }]}>
          {MONTH_NAMES[calMonth]} {calYear}
        </ThemedText>

        <View style={styles.navGroup}>
          <TouchableOpacity
            onPress={onPrevMonth}
            style={[
              styles.navButton,
              {
                backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={15} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNextMonth}
            style={[
              styles.navButton,
              {
                backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={15} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onGoToday}
            style={[
              styles.todayButton,
              {
                backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              },
            ]}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.todayButtonText, { color: colors.text }]}>
              Today
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Header */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((w) => (
          <ThemedText
            key={w}
            style={[styles.weekdayText, { color: colors.textSecondary }]}
          >
            {w}
          </ThemedText>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {calendarDays.map((item, idx) => {
          const isToday = item.dateStr === todayStr;
          const isSelected = item.dateStr === selectedDate;

          return (
            <TouchableOpacity
              key={`${item.dateStr}-${idx}`}
              onPress={() => onSelectDate(item.dateStr)}
              style={[
                styles.dayCell,
                isSelected && !isToday && [
                  styles.dayCellSelected,
                  { borderColor: '#3B82F6', backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF' },
                ],
              ]}
              activeOpacity={0.75}
            >
              {isToday ? (
                <View style={styles.todayCircle}>
                  <ThemedText style={styles.todayDayNumber}>
                    {item.dayNumber}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText
                  style={[
                    styles.dayNumber,
                    {
                      color: !item.isCurrentMonth
                        ? colors.textSecondary
                        : colors.text,
                      opacity: !item.isCurrentMonth ? 0.3 : 1,
                    },
                  ]}
                >
                  {item.dayNumber}
                </ThemedText>
              )}

              {/* Status Indicator Dot */}
              {item.isCurrentMonth && item.status ? (
                <View
                  style={[
                    styles.statusDot,
                    item.status === 'present' && { backgroundColor: '#10B981' },
                    item.status === 'absent' && { backgroundColor: '#F43F5E' },
                    item.status === 'leave' && { backgroundColor: '#F59E0B' },
                    item.status === 'holiday' && { backgroundColor: '#A855F7' },
                  ]}
                />
              ) : (
                <View style={styles.statusDotPlaceholder} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Legend */}
      <View
        style={[
          styles.legendRow,
          { borderTopColor: isDark ? '#27272A' : '#F1F5F9' },
        ]}
      >
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Present</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F43F5E' }]} />
          <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Absent</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Leave</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
          <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Holiday</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
          <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>Today</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayButton: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 2,
  },
  dayCellSelected: {
    borderWidth: 1.5,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
    includeFontPadding: false,
  },
  todayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  todayDayNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
    includeFontPadding: false,
  },
  statusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 2.75,
    marginTop: 2,
  },
  statusDotPlaceholder: {
    height: 5.5,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
});
