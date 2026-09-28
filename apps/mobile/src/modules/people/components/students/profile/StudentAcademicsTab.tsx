import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import type { Student } from '@/types/index';
import { EMERALD } from './types';

interface StudentAcademicsTabProps {
  student: Student;
}

export function StudentAcademicsTab({ student }: StudentAcademicsTabProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <View style={styles.container}>
      {/* Current Academic Enrollment */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="school-outline" size={18} color={EMERALD.primary} style={{ marginRight: 8 }} />
          <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
            Academic Enrollment
          </ThemedText>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Enrolled Class</ThemedText>
              <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{student.className || 'Unassigned'}</ThemedText>
            </View>
            <View style={styles.gridCol}>
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Class Roll No</ThemedText>
              <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{student.rollNumber || '—'}</ThemedText>
            </View>
          </View>

          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Curriculum</ThemedText>
              <ThemedText style={[styles.fieldValue, { color: colors.text }]}>Standard Curriculum</ThemedText>
            </View>
            <View style={styles.gridCol}>
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Academic Standing</ThemedText>
              <ThemedText style={[styles.fieldValue, { color: EMERALD.primary }]}>Active / Enrolled</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Report Cards Info Banner */}
      <View style={[
        styles.infoBanner, 
        { 
          backgroundColor: activeTheme === 'dark' ? EMERALD.darkBg : EMERALD.lightBg,
          borderColor: activeTheme === 'dark' ? EMERALD.darkBorder : EMERALD.lightBorder
        }
      ]}>
        <Ionicons name="information-circle-outline" size={22} color={EMERALD.primary} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.infoBannerTitle, { color: EMERALD.primary }]}>
            Examinations & Marks
          </ThemedText>
          <ThemedText style={[styles.infoBannerDesc, { color: colors.textSecondary }]}>
            Term assessments, report cards, and grading results are managed in the Exam Management module.
          </ThemedText>
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
    paddingTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoBannerDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
