import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { AttendanceRecordItem } from './types';
import { MONTH_NAMES } from './utils';

interface RecentAttendanceListProps {
  recentRecords: AttendanceRecordItem[];
  currentRealMonth: number;
  currentRealYear: number;
  onSelectDate: (dateStr: string) => void;
  onOpenViewAll?: () => void;
  title?: string;
  showViewAll?: boolean;
}

export function RecentAttendanceList({
  recentRecords,
  currentRealMonth,
  currentRealYear,
  onSelectDate,
  onOpenViewAll,
  title = 'Recent Attendance',
  showViewAll = true,
}: RecentAttendanceListProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

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
      {/* Header */}
      <View
        style={[
          styles.headerRow,
          { borderBottomColor: isDark ? '#27272A' : '#F1F5F9' },
        ]}
      >
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {title}
        </ThemedText>

        {showViewAll && onOpenViewAll ? (
          <TouchableOpacity
            onPress={onOpenViewAll}
            disabled={recentRecords.length === 0}
            style={[styles.viewAllBtn, recentRecords.length === 0 && { opacity: 0.4 }]}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
            <Ionicons name="arrow-forward" size={13} color="#2563EB" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* List / Empty */}
      {recentRecords.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons
            name="calendar-outline"
            size={32}
            color={colors.textSecondary}
          />
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            No attendance logged yet for {MONTH_NAMES[currentRealMonth]} {currentRealYear}.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {recentRecords.map((item, idx) => {
            const [y, m, d] = item.date.split('-').map(Number);
            const dayNum = d;
            const mShort = MONTH_NAMES[(m || 1) - 1]?.slice(0, 3).toUpperCase();
            const statusKey = (item.status || 'present').toLowerCase();
            const isAbsent = statusKey === 'absent';
            const isLeave = statusKey === 'leave';

            return (
              <TouchableOpacity
                key={item.date}
                style={[
                  styles.itemRow,
                  idx < recentRecords.length - 1 && [
                    styles.itemBorder,
                    { borderBottomColor: isDark ? '#27272A' : '#F1F5F9' },
                  ],
                ]}
                onPress={() => onSelectDate(item.date)}
                activeOpacity={0.7}
              >
                {/* Date Block */}
                <View
                  style={[
                    styles.dateBlock,
                    isAbsent
                      ? {
                          backgroundColor: isDark ? 'rgba(225,29,72,0.15)' : '#FFF1F2',
                          borderColor: isDark ? 'rgba(225,29,72,0.3)' : '#FFE4E6',
                        }
                      : isLeave
                      ? {
                          backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB',
                          borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FEF3C7',
                        }
                      : {
                          backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF',
                          borderColor: isDark ? 'rgba(37,99,235,0.3)' : '#DBEAFE',
                        },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dateDay,
                      {
                        color: isAbsent
                          ? '#E11D48'
                          : isLeave
                          ? '#D97706'
                          : '#2563EB',
                      },
                    ]}
                  >
                    {dayNum}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.dateMonth,
                      {
                        color: isAbsent
                          ? '#E11D48'
                          : isLeave
                          ? '#D97706'
                          : '#2563EB',
                      },
                    ]}
                  >
                    {mShort}
                  </ThemedText>
                </View>

                {/* Middle Info */}
                <View style={styles.middleInfo}>
                  <View style={styles.statusLine}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isAbsent
                            ? '#F43F5E'
                            : isLeave
                            ? '#F59E0B'
                            : '#10B981',
                        },
                      ]}
                    />
                    <ThemedText
                      style={[styles.statusTitle, { color: colors.text }]}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={[styles.timeRange, { color: colors.textSecondary }]}
                  >
                    {isAbsent
                      ? '--'
                      : item.checkIn
                      ? `${item.checkIn}${item.checkOut ? ` - ${item.checkOut}` : ''}`
                      : '--'}
                  </ThemedText>
                </View>

                {/* Right Badge */}
                <View style={styles.rightBadgeWrap}>
                  <View
                    style={[
                      styles.badge,
                      isAbsent
                        ? {
                            backgroundColor: isDark ? 'rgba(225,29,72,0.18)' : '#FFF1F2',
                            borderColor: isDark ? 'rgba(225,29,72,0.3)' : '#FFE4E6',
                          }
                        : isLeave
                        ? {
                            backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : '#FFFBEB',
                            borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FEF3C7',
                          }
                        : {
                            backgroundColor: isDark ? 'rgba(5,150,105,0.18)' : '#ECFDF5',
                            borderColor: isDark ? 'rgba(5,150,105,0.3)' : '#D1FAE5',
                          },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.badgeText,
                        {
                          color: isAbsent
                            ? '#E11D48'
                            : isLeave
                            ? '#D97706'
                            : '#059669',
                        },
                      ]}
                    >
                      {isAbsent ? 'Absent' : isLeave ? 'Leave' : 'On Time'}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  list: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
  },
  dateBlock: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: 0,
  },
  dateDay: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'center',
    includeFontPadding: false,
    width: '100%',
  },
  dateMonth: {
    fontSize: 9.5,
    fontWeight: '700',
    lineHeight: 11,
    letterSpacing: 0.5,
    textAlign: 'center',
    includeFontPadding: false,
    width: '100%',
    marginTop: 2,
  },
  middleInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  timeRange: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  rightBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
