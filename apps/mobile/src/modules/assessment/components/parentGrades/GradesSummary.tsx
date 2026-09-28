import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

interface GradesSummaryProps {
  gpa: string;
  rank: string;
  attendance: string;
}

export function GradesSummary({ gpa, rank, attendance }: GradesSummaryProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const metrics = [
    { label: 'Current GPA', value: gpa, icon: 'ribbon', color: '#FF2D55' },
    { label: 'Class Rank', value: rank, icon: 'trophy', color: '#FFD60A' },
    { label: 'Attendance', value: attendance, icon: 'calendar', color: '#34C759' },
  ];

  return (
    <View style={styles.container}>
      {metrics.map((metric, index) => (
        <View key={index} style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={[styles.iconBox, { backgroundColor: metric.color + '15' }]}>
            <Ionicons name={metric.icon as any} size={20} color={metric.color} />
          </View>
          <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{metric.label}</ThemedText>
          <ThemedText style={styles.value}>{metric.value}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
