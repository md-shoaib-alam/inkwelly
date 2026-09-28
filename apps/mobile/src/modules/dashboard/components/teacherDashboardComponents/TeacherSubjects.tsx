import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/store/settings-context';
import type { TeacherDashboardSubject } from '@/types/index';

interface TeacherSubjectsProps {
  subjects: TeacherDashboardSubject[];
  onNavigate?: (route: string) => void;
}

const colorCycles = [
  {
    color: '#2563EB',
    bgLight: '#EFF6FF',
    bgDark: 'rgba(37,99,235,0.18)',
    borderLight: '#DBEAFE',
    borderDark: 'rgba(59,130,246,0.3)',
  },
  {
    color: '#059669',
    bgLight: '#ECFDF5',
    bgDark: 'rgba(5,150,105,0.18)',
    borderLight: '#D1FAE5',
    borderDark: 'rgba(16,185,129,0.3)',
  },
  {
    color: '#D97706',
    bgLight: '#FFFBEB',
    bgDark: 'rgba(217,119,6,0.18)',
    borderLight: '#FEF3C7',
    borderDark: 'rgba(245,158,11,0.3)',
  },
  {
    color: '#9333EA',
    bgLight: '#FAF5FF',
    bgDark: 'rgba(147,51,234,0.18)',
    borderLight: '#F3E8FF',
    borderDark: 'rgba(168,85,247,0.3)',
  },
];

export function TeacherSubjects({ subjects = [], onNavigate }: TeacherSubjectsProps) {
  const { activeTheme } = useSettings();
  const isDark = activeTheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderColor: isDark ? '#27272A' : '#E4E4E7',
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? '#27272A' : '#F4F4F5' },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="book-outline" size={17} color="#2563EB" />
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#F4F4F5' : '#09090B' },
            ]}
          >
            My Subjects
          </Text>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isDark ? 'rgba(37,99,235,0.18)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#DBEAFE',
              },
            ]}
          >
            <Text style={styles.countBadgeText}>{subjects.length} subjects</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onNavigate?.('/(teacher)/(tabs)/my-subjects')}
          activeOpacity={0.75}
        >
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {subjects.slice(0, 5).map((subject, idx) => {
          const color = colorCycles[idx % colorCycles.length];
          return (
            <TouchableOpacity
              key={subject.id || String(idx)}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('/(teacher)/(tabs)/my-subjects')}
              style={[
                styles.subjectRow,
                idx > 0 && {
                  borderTopWidth: 1,
                  borderTopColor: isDark ? '#27272A' : '#F4F4F5',
                },
              ]}
            >
              <View style={styles.subjectLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark ? color.bgDark : color.bgLight,
                      borderColor: isDark ? color.borderDark : color.borderLight,
                    },
                  ]}
                >
                  <Ionicons name="book-outline" size={16} color={color.color} />
                </View>

                <View style={styles.subjectTextWrap}>
                  <Text
                    style={[
                      styles.subjectName,
                      { color: isDark ? '#F4F4F5' : '#09090B' },
                    ]}
                    numberOfLines={1}
                  >
                    {subject.name}
                  </Text>
                  <Text
                    style={[
                      styles.subjectSubtitle,
                      { color: isDark ? '#A1A1AA' : '#64748B' },
                    ]}
                    numberOfLines={1}
                  >
                    {subject.className}
                    {subject.code ? ` • ${subject.code}` : ''}
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={14}
                color={isDark ? '#71717A' : '#A1A1AA'}
              />
            </TouchableOpacity>
          );
        })}

        {subjects.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={28}
              color={isDark ? '#52525B' : '#CBD5E1'}
            />
            <Text
              style={[
                styles.emptyTitle,
                { color: isDark ? '#E4E4E7' : '#27272A' },
              ]}
            >
              No subjects assigned
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: isDark ? '#71717A' : '#71717A' },
              ]}
            >
              Contact your administrator to assign subjects
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  body: {
    paddingTop: 6,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  subjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectTextWrap: {
    flex: 1,
    gap: 2,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
  },
  subjectSubtitle: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 11,
  },
});
