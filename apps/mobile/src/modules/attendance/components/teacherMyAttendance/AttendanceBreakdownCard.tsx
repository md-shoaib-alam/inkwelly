import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { AttendanceMetrics } from './types';

interface AttendanceBreakdownCardProps {
  metrics: AttendanceMetrics;
}

export function AttendanceBreakdownCard({ metrics }: AttendanceBreakdownCardProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const total = metrics.recordedDays || 0;
  const presentPct = total > 0 ? (metrics.present / total) * 100 : 0;
  const absentPct = total > 0 ? (metrics.absent / total) * 100 : 0;
  const leavePct = total > 0 ? (metrics.leave / total) * 100 : 0;
  const holidayPct = total > 0 ? (metrics.holiday / total) * 100 : 0;

  const R = 38;
  const C = 2 * Math.PI * R;
  const strokeWidth = 9;

  const presentOffset = 0;
  const absentOffset = -presentPct;
  const leaveOffset = -(presentPct + absentPct);
  const holidayOffset = -(presentPct + absentPct + leavePct);

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
      <ThemedText style={[styles.title, { color: colors.text }]}>
        Current Month Breakdown
      </ThemedText>

      <View style={styles.contentRow}>
        {/* Donut Chart Container */}
        <View style={styles.chartWrapper}>
          <Svg width={100} height={100} viewBox="0 0 100 100">
            <G rotation="-90" origin="50, 50">
              {/* Background Circle */}
              <Circle
                cx="50"
                cy="50"
                r={R}
                stroke={isDark ? '#27272A' : '#F1F5F9'}
                strokeWidth={strokeWidth}
                fill="none"
              />

              {/* Present (Emerald) */}
              {presentPct > 0 && (
                <Circle
                  cx="50"
                  cy="50"
                  r={R}
                  stroke="#10B981"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${(presentPct / 100) * C} ${C}`}
                  strokeDashoffset={(presentOffset / 100) * C}
                />
              )}

              {/* Absent (Rose) */}
              {absentPct > 0 && (
                <Circle
                  cx="50"
                  cy="50"
                  r={R}
                  stroke="#F43F5E"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${(absentPct / 100) * C} ${C}`}
                  strokeDashoffset={(absentOffset / 100) * C}
                />
              )}

              {/* Leave (Amber) */}
              {leavePct > 0 && (
                <Circle
                  cx="50"
                  cy="50"
                  r={R}
                  stroke="#F59E0B"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${(leavePct / 100) * C} ${C}`}
                  strokeDashoffset={(leaveOffset / 100) * C}
                />
              )}

              {/* Holiday (Purple) */}
              {holidayPct > 0 && (
                <Circle
                  cx="50"
                  cy="50"
                  r={R}
                  stroke="#A855F7"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${(holidayPct / 100) * C} ${C}`}
                  strokeDashoffset={(holidayOffset / 100) * C}
                />
              )}
            </G>
          </Svg>

          {/* Centered Text inside Donut */}
          <View style={styles.chartCenterText}>
            <ThemedText style={[styles.centerCount, { color: colors.text }]}>
              {metrics.recordedDays}
            </ThemedText>
            <ThemedText style={[styles.centerLabel, { color: colors.textSecondary }]}>
              Days Logged
            </ThemedText>
          </View>
        </View>

        {/* Breakdown Rows */}
        <View style={styles.breakdownList}>
          <View style={styles.breakdownRow}>
            <View style={styles.rowLabelWrap}>
              <View style={[styles.rowDot, { backgroundColor: '#10B981' }]} />
              <ThemedText style={[styles.rowLabel, { color: colors.textSecondary }]}>
                Present
              </ThemedText>
            </View>
            <ThemedText style={[styles.rowVal, { color: colors.text }]}>
              {metrics.present} ({metrics.presentRate}%)
            </ThemedText>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLabelWrap}>
              <View style={[styles.rowDot, { backgroundColor: '#F43F5E' }]} />
              <ThemedText style={[styles.rowLabel, { color: colors.textSecondary }]}>
                Absent
              </ThemedText>
            </View>
            <ThemedText style={[styles.rowVal, { color: colors.text }]}>
              {metrics.absent} ({metrics.absentRate}%)
            </ThemedText>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLabelWrap}>
              <View style={[styles.rowDot, { backgroundColor: '#F59E0B' }]} />
              <ThemedText style={[styles.rowLabel, { color: colors.textSecondary }]}>
                Leave
              </ThemedText>
            </View>
            <ThemedText style={[styles.rowVal, { color: colors.text }]}>
              {metrics.leave} ({metrics.leaveRate}%)
            </ThemedText>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLabelWrap}>
              <View style={[styles.rowDot, { backgroundColor: '#A855F7' }]} />
              <ThemedText style={[styles.rowLabel, { color: colors.textSecondary }]}>
                Holiday
              </ThemedText>
            </View>
            <ThemedText style={[styles.rowVal, { color: colors.text }]}>
              {metrics.holiday} ({metrics.holidayRate}%)
            </ThemedText>
          </View>
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
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  chartWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCount: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  centerLabel: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 12,
    marginTop: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  breakdownList: {
    flex: 1,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowVal: {
    fontSize: 12,
    fontWeight: '700',
  },
});
