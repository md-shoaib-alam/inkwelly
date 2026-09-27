import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/store/settings-context';
import type { TeacherTodaySchedule } from '@/types';

interface TodayScheduleProps {
  schedule: TeacherTodaySchedule[];
  formatTime?: (time: string) => string;
  onNavigate?: (route: string) => void;
}

export function TodaySchedule({ schedule = [], formatTime, onNavigate }: TodayScheduleProps) {
  const { activeTheme } = useSettings();
  const isDark = activeTheme === 'dark';

  const defaultFormatTime = (time: string) => {
    if (!time) return '';
    if (formatTime) return formatTime(time);
    // Parse HH:mm or HH:mm:ss if present
    const parts = time.split(':');
    if (parts.length >= 2) {
      let hour = parseInt(parts[0], 10);
      const minute = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${minute} ${ampm}`;
    }
    return time;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderColor: isDark ? '#27272A' : '#E4E4E7',
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? '#27272A' : '#F4F4F5' },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={17} color="#2563EB" />
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#F4F4F5' : '#09090B' },
            ]}
          >
            Today&apos;s Schedule
          </Text>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isDark ? 'rgba(37,99,235,0.18)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#DBEAFE',
              },
            ]}
          >
            <Text style={styles.countBadgeText}>{schedule.length} classes</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onNavigate?.('/(teacher)/(tabs)/timetable')}
          style={[
            styles.viewAllBtn,
            {
              backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF',
              borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#DBEAFE',
            },
          ]}
          activeOpacity={0.75}
        >
          <Ionicons name="calendar-outline" size={12} color="#2563EB" />
          <Text style={styles.viewAllText}>Timetable</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {schedule.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDark ? '#27272A' : '#F4F4F5' },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={26}
                color={isDark ? '#71717A' : '#A1A1AA'}
              />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: isDark ? '#E4E4E7' : '#27272A' },
              ]}
            >
              No classes scheduled for today
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: isDark ? '#71717A' : '#71717A' },
              ]}
            >
              Enjoy your day off!
            </Text>
          </View>
        ) : (
          <View style={styles.scheduleList}>
            {schedule.map((entry, index) => (
              <View
                key={entry.id || String(index)}
                style={[
                  styles.entryCard,
                  {
                    backgroundColor: isDark ? '#202024' : '#F8FAFC',
                    borderColor: isDark ? '#2E2E33' : '#F1F5F9',
                  },
                ]}
              >
                <View style={styles.entryLeft}>
                  {/* Time box */}
                  <View
                    style={[
                      styles.timeBox,
                      {
                        backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                        borderColor: isDark ? '#2E2E33' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text style={styles.startTime}>
                      {defaultFormatTime(entry.startTime)}
                    </Text>
                    <Text
                      style={[
                        styles.endTime,
                        { color: isDark ? '#71717A' : '#94A3B8' },
                      ]}
                    >
                      {defaultFormatTime(entry.endTime)}
                    </Text>
                  </View>

                  {/* Subject & class info */}
                  <View style={styles.subjectInfo}>
                    <Text
                      style={[
                        styles.subjectName,
                        { color: isDark ? '#F4F4F5' : '#0F172A' },
                      ]}
                      numberOfLines={1}
                    >
                      {entry.subjectName}
                    </Text>
                    <Text
                      style={[
                        styles.className,
                        { color: isDark ? '#A1A1AA' : '#64748B' },
                      ]}
                      numberOfLines={1}
                    >
                      {entry.className}
                    </Text>
                  </View>
                </View>

                {/* Period Badge */}
                <View
                  style={[
                    styles.periodBadge,
                    {
                      backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF',
                      borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#DBEAFE',
                    },
                  ]}
                >
                  <Text style={styles.periodText}>Period {index + 1}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  body: {
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  scheduleList: {
    gap: 8,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  timeBox: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 64,
  },
  startTime: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  endTime: {
    fontSize: 9,
    marginTop: 1,
  },
  subjectInfo: {
    flex: 1,
    gap: 2,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
  },
  className: {
    fontSize: 11,
  },
  periodBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
});
