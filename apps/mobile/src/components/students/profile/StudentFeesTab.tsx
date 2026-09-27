import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import type { Student } from '@/types';
import { EMERALD } from './types';

interface StudentFeesTabProps {
  student: Student;
}

export function StudentFeesTab({ student }: StudentFeesTabProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <View style={styles.container}>
      {/* Account Status Card */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="card-outline" size={18} color={EMERALD.primary} style={{ marginRight: 8 }} />
          <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
            Fee & Invoicing Status
          </ThemedText>
        </View>
        <View style={styles.cardBody}>
          <View style={[
            styles.feeStatusBanner, 
            { 
              backgroundColor: activeTheme === 'dark' ? EMERALD.darkBg : EMERALD.lightBg,
              borderColor: activeTheme === 'dark' ? EMERALD.darkBorder : EMERALD.lightBorder 
            }
          ]}>
            <ThemedText style={[styles.feeStatusTag, { color: EMERALD.primary }]}>
              ACCOUNT STATUS
            </ThemedText>
            <ThemedText style={[styles.feeStatusMain, { color: colors.text }]}>
              Current & Up to Date
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Fee Category</ThemedText>
            <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
              {student.className || 'General'} Standard Fee
            </ThemedText>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Payment Channel</ThemedText>
            <ThemedText style={[styles.fieldValue, { color: EMERALD.primary }]}>
              Integrated Counter & App Portal
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
  feeStatusBanner: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  feeStatusTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  feeStatusMain: {
    fontSize: 14,
    fontWeight: '600',
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
