import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

interface AttendanceDay {
  day: number;
  status: 'present' | 'absent' | 'late' | 'holiday' | 'none';
  isCurrentMonth: boolean;
}

interface AttendanceCalendarProps {
  data: AttendanceDay[];
  currentPeriod: string;
  onPrev: () => void;
  onNext: () => void;
}

export function AttendanceCalendar({ data, currentPeriod, onPrev, onNext }: AttendanceCalendarProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const renderStatusDot = (status: AttendanceDay['status']) => {
    switch (status) {
      case 'present': return <View style={[styles.dot, { backgroundColor: '#34C759' }]} />;
      case 'absent': return <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />;
      case 'late': return <View style={[styles.dot, { backgroundColor: '#FF9500' }]} />;
      case 'holiday': return <View style={[styles.dot, { backgroundColor: '#8E8E93' }]} />;
      default: return null;
    }
  };

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.header}>
        <ThemedText style={styles.periodText}>{currentPeriod}</ThemedText>
        <View style={styles.navButtons}>
          <TouchableOpacity onPress={onPrev} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekdayRow}>
        {weekdays.map((day, i) => (
          <ThemedText key={i} style={[styles.weekdayText, { color: colors.textSecondary }]}>{day}</ThemedText>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {data.map((item, index) => (
          <View key={index} style={styles.dayCell}>
            <ThemedText style={[
              styles.dayText, 
              { opacity: item.isCurrentMonth ? 1 : 0.3 }
            ]}>
              {item.day}
            </ThemedText>
            {renderStatusDot(item.status)}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <LegendItem color="#34C759" label="Present" />
        <LegendItem color="#FF3B30" label="Absent" />
        <LegendItem color="#FF9500" label="Late" />
        <LegendItem color="#8E8E93" label="Holiday" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText style={styles.legendLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  navButtons: {
    flexDirection: 'row',
  },
  navButton: {
    padding: 4,
    marginLeft: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    marginBottom: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
});
