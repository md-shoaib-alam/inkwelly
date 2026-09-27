import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

export function AttendanceSkeleton() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <View style={styles.container}>
      {/* Child Selector Skeleton */}
      <View style={styles.childSelectorRow}>
        <Skeleton width={90} height={34} borderRadius={17} />
        <Skeleton width={110} height={34} borderRadius={17} />
        <Skeleton width={80} height={34} borderRadius={17} />
      </View>

      {/* Stats Boxes Skeleton */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.statBox,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.backgroundSelected,
              },
            ]}
          >
            <Skeleton width={22} height={22} borderRadius={11} />
            <Skeleton width="55%" height={18} borderRadius={4} />
            <Skeleton width="45%" height={11} borderRadius={3} />
          </View>
        ))}
      </View>

      {/* Today Attendance Card Skeleton */}
      <View
        style={[
          styles.todayCard,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: colors.backgroundSelected,
          },
        ]}
      >
        <Skeleton width={130} height={16} borderRadius={4} />
        <Skeleton width={75} height={24} borderRadius={8} />
      </View>

      {/* Calendar Card Skeleton */}
      <View
        style={[
          styles.calendarCard,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: colors.backgroundSelected,
          },
        ]}
      >
        <View style={styles.calendarHeader}>
          <Skeleton width="35%" height={20} borderRadius={4} />
          <Skeleton width="30%" height={28} borderRadius={12} />
        </View>

        {/* Days of week */}
        <View style={styles.weekHeader}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} style={{ flex: 1 }} height={12} borderRadius={3} />
          ))}
        </View>

        {/* Calendar Grid Rows */}
        {[1, 2, 3, 4, 5].map((rowIdx) => (
          <View key={rowIdx} style={styles.gridRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((colIdx) => (
              <Skeleton key={colIdx} style={{ flex: 1 }} height={36} borderRadius={8} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  childSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
