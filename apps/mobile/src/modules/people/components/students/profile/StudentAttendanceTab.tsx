import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import type { Student } from '@/types/index';
import { EMERALD } from './types';

interface StudentAttendanceTabProps {
  student: Student;
}

export function StudentAttendanceTab({ student }: StudentAttendanceTabProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <View style={styles.container}>
      {/* Attendance Stats Cards */}
      <View style={styles.statGrid}>
        <View style={[
          styles.statCard, 
          { 
            backgroundColor: activeTheme === 'dark' ? EMERALD.darkBg : EMERALD.lightBg,
            borderColor: activeTheme === 'dark' ? EMERALD.darkBorder : EMERALD.lightBorder
          }
        ]}>
          <ThemedText style={[styles.statNumber, { color: EMERALD.primary }]}>96%</ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Attendance Rate</ThemedText>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
          <ThemedText style={[styles.statNumber, { color: colors.text }]}>Regular</ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Status</ThemedText>
        </View>
      </View>

      {/* Attendance Details Card */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={18} color={EMERALD.primary} style={{ marginRight: 8 }} />
          <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
            Attendance Tracking
          </ThemedText>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tracking Mode</ThemedText>
            <ThemedText style={[styles.fieldValue, { color: colors.text }]}>Daily Classroom Roll Call</ThemedText>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notification Alerts</ThemedText>
            <ThemedText style={[styles.fieldValue, { color: EMERALD.primary }]}>
              {student.parentPhone || student.parentEmail ? 'Active for Guardian' : 'No Guardian Contact'}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 20,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
