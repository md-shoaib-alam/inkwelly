import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

interface AttendanceRecord {
  date: string;
  status: string;
}

interface TodayAttendanceCardProps {
  records: AttendanceRecord[];
}

export function TodayAttendanceCard({ records }: TodayAttendanceCardProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const getTodayInfo = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const record = records.find((r) => r.date.startsWith(todayStr));

    if (record) {
      return {
        status: record.status,
      };
    }

    return {
      status: 'not_marked',
    };
  };

  const todayInfo = getTodayInfo();

  const getBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return {
          label: 'Present',
          bg: activeTheme === 'light' ? '#E8F5E9' : 'rgba(76, 175, 80, 0.15)',
          text: '#2E7D32',
          border: 'rgba(76, 175, 80, 0.3)',
        };
      case 'absent':
        return {
          label: 'Absent',
          bg: activeTheme === 'light' ? '#FFEBEE' : 'rgba(244, 67, 54, 0.15)',
          text: '#C62828',
          border: 'rgba(244, 67, 54, 0.3)',
        };
      default:
        return {
          label: 'Not Marked',
          bg: colors.backgroundElement,
          text: colors.textSecondary,
          border: colors.backgroundSelected,
        };
    }
  };

  const badge = getBadgeStyle(todayInfo.status);

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
      <View style={styles.left}>
        <ThemedText style={styles.title} numberOfLines={1}>Today Attendance</ThemedText>
      </View>

      <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
        <ThemedText style={[styles.badgeText, { color: badge.text }]}>
          {badge.label}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  left: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subText: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
