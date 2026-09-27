import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { AttendanceMetrics } from './types';

interface MonthlyMetricCardsProps {
  metrics: AttendanceMetrics;
}

export function MonthlyMetricCards({ metrics }: MonthlyMetricCardsProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const cards = [
    {
      key: 'present',
      label: 'Present',
      count: metrics.present,
      rate: metrics.presentRate,
      fg: '#059669',
      bg: isDark ? 'rgba(5,150,105,0.18)' : '#ECFDF5',
      border: isDark ? 'rgba(5,150,105,0.3)' : '#D1FAE5',
      bar: '#10B981',
      icon: 'checkmark-circle-outline' as const,
    },
    {
      key: 'absent',
      label: 'Absent',
      count: metrics.absent,
      rate: metrics.absentRate,
      fg: '#E11D48',
      bg: isDark ? 'rgba(225,29,72,0.18)' : '#FFF1F2',
      border: isDark ? 'rgba(225,29,72,0.3)' : '#FFE4E6',
      bar: '#F43F5E',
      icon: 'close-circle-outline' as const,
    },
    {
      key: 'leave',
      label: 'Leave',
      count: metrics.leave,
      rate: metrics.leaveRate,
      fg: '#D97706',
      bg: isDark ? 'rgba(245,158,11,0.18)' : '#FFFBEB',
      border: isDark ? 'rgba(245,158,11,0.3)' : '#FEF3C7',
      bar: '#F59E0B',
      icon: 'time-outline' as const,
    },
    {
      key: 'holiday',
      label: 'Holiday',
      count: metrics.holiday,
      rate: metrics.holidayRate,
      fg: '#9333EA',
      bg: isDark ? 'rgba(147,51,234,0.18)' : '#FAF5FF',
      border: isDark ? 'rgba(147,51,234,0.3)' : '#F3E8FF',
      bar: '#A855F7',
      icon: 'calendar-outline' as const,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Ionicons name="calendar-outline" size={15} color="#2563EB" />
          <Text style={[styles.headerTitle, { color: isDark ? '#FAFAFA' : '#0F172A' }]}>
            This Month Overview
          </Text>
        </View>
        <Text style={[styles.headerSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          {metrics.recordedDays} of {metrics.total} days logged
        </Text>
      </View>

      {/* 2x2 Grid + Full-Width Total Card */}
      <View style={styles.grid}>
        {cards.map((c) => (
          <View
            key={c.key}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                borderColor: isDark ? '#27272A' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.cardTop}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: c.bg, borderColor: c.border },
                ]}
              >
                <Ionicons name={c.icon} size={19} color={c.fg} />
              </View>
              <View style={styles.cardStats}>
                <Text style={[styles.countText, { color: isDark ? '#FAFAFA' : '#0F172A' }]}>
                  {c.count}
                </Text>
                <Text style={[styles.labelText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {c.label}
                </Text>
              </View>
            </View>

            {/* Progress Bar & Rate */}
            <View style={styles.barRow}>
              <View style={[styles.barTrack, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: c.bar,
                      width: `${Math.min(parseFloat(c.rate) || 0, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.rateText, { color: c.fg }]}>
                {c.rate}%
              </Text>
            </View>
          </View>
        ))}

        {/* Card 5: Total Days (Full Width) */}
        <View
          style={[
            styles.card,
            styles.cardFull,
            {
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              borderColor: isDark ? '#27272A' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.totalTop}>
            <View style={styles.totalLeft}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDark ? 'rgba(37,99,235,0.18)' : '#EFF6FF',
                    borderColor: isDark ? 'rgba(37,99,235,0.3)' : '#DBEAFE',
                  },
                ]}
              >
                <Ionicons name="star-outline" size={19} color="#2563EB" />
              </View>
              <View style={styles.cardStats}>
                <Text style={[styles.countText, { color: isDark ? '#FAFAFA' : '#0F172A' }]}>
                  {metrics.total}
                </Text>
                <Text style={[styles.labelText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Total Days
                </Text>
              </View>
            </View>
            <Text style={styles.totalPct}>100%</Text>
          </View>

          <View style={styles.barRow}>
            <View style={[styles.barTrack, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
              <View style={[styles.barFill, { backgroundColor: '#2563EB', width: '100%' }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    fontWeight: '400',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  cardFull: {
    width: '100%',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStats: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  countText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 25,
    includeFontPadding: false,
  },
  labelText: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
    includeFontPadding: false,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  rateText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 38,
    textAlign: 'right',
    includeFontPadding: false,
  },
  totalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalPct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
});
