import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import type { Teacher } from '../types';
import { EMERALD } from './types';

interface TeacherClassesTabProps {
  teacher: Teacher;
}

export function TeacherClassesTab({ teacher }: TeacherClassesTabProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const subjects = teacher.subjects || [];
  const classes = teacher.classes || [];

  return (
    <View style={styles.container}>
      {/* Assigned Subjects Card */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconPill, { backgroundColor: EMERALD.light }]}>
            <Ionicons name="book-outline" size={16} color={EMERALD.primary} />
          </View>
          <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
            Assigned Subjects ({subjects.length})
          </ThemedText>
        </View>

        <View style={styles.cardBody}>
          {subjects.length > 0 ? (
            <View style={styles.badgeContainer}>
              {subjects.map((subj, index) => (
                <View key={index} style={[styles.badgePill, { backgroundColor: EMERALD.light, borderColor: EMERALD.border }]}>
                  <ThemedText style={[styles.badgeText, { color: EMERALD.dark }]}>
                    {subj}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={24} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No subjects assigned yet
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Classes Taught Card */}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconPill, { backgroundColor: EMERALD.light }]}>
            <Ionicons name="school-outline" size={16} color={EMERALD.primary} />
          </View>
          <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
            Classes Taught ({classes.length})
          </ThemedText>
        </View>

        <View style={styles.cardBody}>
          {classes.length > 0 ? (
            <View style={styles.badgeContainer}>
              {classes.map((cls, index) => (
                <View key={index} style={[styles.badgePill, { backgroundColor: EMERALD.light, borderColor: EMERALD.border }]}>
                  <ThemedText style={[styles.badgeText, { color: EMERALD.dark }]}>
                    {cls}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={24} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No classes assigned yet
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardBody: {},
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
