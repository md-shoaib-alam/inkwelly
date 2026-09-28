import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

interface TeacherStatsProps {
  totalClasses: number;
  totalStudents: number;
  pendingAssignments: number;
  todayAttendanceLabel: string;
  onNavigate?: (route: string) => void;
}

export function TeacherStats({
  totalClasses,
  totalStudents,
  pendingAssignments,
  todayAttendanceLabel,
  onNavigate,
}: TeacherStatsProps) {
  const { activeTheme } = useSettings();
  const isDark = activeTheme === 'dark';

  const cards = [
    {
      title: 'My Classes',
      value: String(totalClasses ?? 0),
      route: '/(teacher)/(tabs)/my-classes',
      icon: 'book-outline' as const,
      color: '#2563EB',
      iconBg: isDark ? 'rgba(37,99,235,0.18)' : '#EFF6FF',
      iconBorder: isDark ? 'rgba(59,130,246,0.3)' : '#DBEAFE',
      waveBg: isDark ? 'rgba(30,58,138,0.15)' : 'rgba(219,234,254,0.35)',
    },
    {
      title: 'Total Students',
      value: String(totalStudents ?? 0),
      route: '/(teacher)/(tabs)/my-classes',
      icon: 'people-outline' as const,
      color: '#059669',
      iconBg: isDark ? 'rgba(5,150,105,0.18)' : '#ECFDF5',
      iconBorder: isDark ? 'rgba(16,185,129,0.3)' : '#D1FAE5',
      waveBg: isDark ? 'rgba(6,78,59,0.15)' : 'rgba(209,250,229,0.35)',
    },
    {
      title: 'Pending Homework',
      value: String(pendingAssignments ?? 0),
      route: '/(teacher)/(tabs)/homework',
      icon: 'document-text-outline' as const,
      color: '#D97706',
      iconBg: isDark ? 'rgba(217,119,6,0.18)' : '#FFFBEB',
      iconBorder: isDark ? 'rgba(245,158,11,0.3)' : '#FEF3C7',
      waveBg: isDark ? 'rgba(120,53,15,0.15)' : 'rgba(254,243,199,0.35)',
    },
    {
      title: "Today's Attendance",
      value: todayAttendanceLabel,
      route: '/(teacher)/(tabs)/my-attendance',
      icon: 'checkmark-circle-outline' as const,
      color: '#9333EA',
      iconBg: isDark ? 'rgba(147,51,234,0.18)' : '#FAF5FF',
      iconBorder: isDark ? 'rgba(168,85,247,0.3)' : '#F3E8FF',
      waveBg: isDark ? 'rgba(88,28,135,0.15)' : 'rgba(243,232,255,0.35)',
    },
  ];

  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <TouchableOpacity
          key={card.title}
          activeOpacity={0.75}
          onPress={() => onNavigate?.(card.route)}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              borderColor: isDark ? '#27272A' : '#E4E4E7',
            },
          ]}
        >
          {/* Subtle bottom wave accent */}
          <View
            style={[
              styles.waveAccent,
              { backgroundColor: card.waveBg },
            ]}
          />

          {/* Top row: Icon, Title & Arrow */}
          <View style={styles.cardHeader}>
            <View style={styles.iconTitleRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: card.iconBg,
                    borderColor: card.iconBorder,
                  },
                ]}
              >
                <Ionicons name={card.icon} size={16} color={card.color} />
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDark ? '#D4D4D8' : '#3F3F46' },
                ]}
                numberOfLines={1}
              >
                {card.title}
              </Text>
            </View>

            <View
              style={[
                styles.arrowCircle,
                { backgroundColor: card.iconBg },
              ]}
            >
              <Ionicons name="arrow-forward" size={11} color={card.color} />
            </View>
          </View>

          {/* Stat Value */}
          <View style={styles.valueRow}>
            <Text
              style={[
                styles.statValue,
                { color: isDark ? '#F4F4F5' : '#09090B' },
              ]}
            >
              {card.value}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 16,
  },
  card: {
    width: '48.5%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    minHeight: 94,
    justifyContent: 'space-between',
  },
  waveAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  arrowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueRow: {
    marginTop: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
});
