import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

type Tab = 'today' | 'calendar' | 'history';

interface AttendanceSkeletonProps {
  activeTab: Tab;
}

// Loading placeholders that mirror each tab's real card layout, so the screen
// doesn't jump when data lands. Only the active tab is rendered while loading.
export function AttendanceSkeleton({ activeTab }: AttendanceSkeletonProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const cardStyle = [
    styles.card,
    {
      backgroundColor: isDark ? '#18181B' : '#FFFFFF',
      borderColor: isDark ? '#27272A' : '#E2E8F0',
    },
  ];

  return (
    <View style={styles.container}>
      {activeTab === 'today' && (
        <>
          {/* Today's Attendance card */}
          <View style={cardStyle}>
            <View style={styles.rowBetween}>
              <Skeleton width="45%" height={16} />
              <Skeleton width={92} height={20} borderRadius={8} />
            </View>
            <View style={styles.highlightBox}>
              <Skeleton width={34} height={34} borderRadius={17} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={13} />
                <Skeleton width="40%" height={11} />
              </View>
            </View>
            <View style={styles.rowGap}>
              <Skeleton style={{ flex: 1 }} height={62} borderRadius={12} />
              <Skeleton style={{ flex: 1 }} height={62} borderRadius={12} />
            </View>
            <Skeleton height={44} borderRadius={14} />
          </View>

          {/* Breakdown card */}
          <View style={cardStyle}>
            <Skeleton width="40%" height={15} />
            <View style={{ gap: 10, marginTop: 4 }}>
              <Skeleton height={10} borderRadius={999} />
              <Skeleton height={10} borderRadius={999} />
              <Skeleton width="80%" height={10} borderRadius={999} />
            </View>
          </View>
        </>
      )}

      {activeTab === 'calendar' && (
        <>
          <View style={styles.rowBetween}>
            <Skeleton width={150} height={15} />
            <Skeleton width={110} height={12} />
          </View>
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={cardStyle}>
                <View style={styles.rowGap}>
                  <Skeleton width={38} height={38} borderRadius={12} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="50%" height={20} />
                    <Skeleton width="35%" height={11} />
                  </View>
                </View>
                <Skeleton height={6} borderRadius={999} />
              </View>
            ))}
          </View>

          {/* Calendar block */}
          <View style={cardStyle}>
            <View style={styles.rowBetween}>
              <Skeleton width={120} height={15} />
              <Skeleton width={90} height={26} borderRadius={8} />
            </View>
            <View style={styles.calGrid}>
              {Array.from({ length: 42 }).map((_, i) => (
                <Skeleton key={i} height={30} borderRadius={8} style={styles.calCell} />
              ))}
            </View>
          </View>
        </>
      )}

      {activeTab === 'history' && (
        <View style={cardStyle}>
          <View style={styles.rowBetween}>
            <Skeleton width={140} height={16} />
            <Skeleton width={64} height={14} />
          </View>
          <View style={{ gap: 14, marginTop: 6 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={styles.historyRow}>
                <Skeleton width={44} height={44} borderRadius={12} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="45%" height={13} />
                  <Skeleton width="30%" height={11} />
                </View>
                <Skeleton width={62} height={22} borderRadius={8} />
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  calCell: {
    width: '12.5%',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
