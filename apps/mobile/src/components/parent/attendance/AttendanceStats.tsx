import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

interface AttendanceStatsProps {
  percentage: number;
  present: number;
  absent: number;
}

export function AttendanceStats({ percentage, present, absent }: AttendanceStatsProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const stats = [
    { label: 'Overall', value: `${percentage}%`, icon: 'pie-chart', color: '#007AFF' },
    { label: 'Present', value: present, icon: 'checkmark-circle', color: '#34C759' },
    { label: 'Absent', value: absent, icon: 'close-circle', color: '#FF3B30' },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={[styles.iconWrapper, { backgroundColor: stat.color + '15' }]}>
            <Ionicons name={stat.icon as any} size={20} color={stat.color} />
          </View>
          <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{stat.label}</ThemedText>
          <ThemedText style={styles.value}>{stat.value}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
