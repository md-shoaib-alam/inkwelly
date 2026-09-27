import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

interface EmptyTimetableStateProps {
  selectedClass: string;
  classes: { id: string; name: string; section: string }[];
  onClassSelect: (id: string) => void;
  isTeacher?: boolean;
}

export function EmptyTimetableState({
  selectedClass,
  classes = [],
  onClassSelect,
  isTeacher = false,
}: EmptyTimetableStateProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  if (!selectedClass && !isTeacher) {
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Banner header */}
        <View style={styles.bannerRow}>
          <View style={[styles.iconBox, { backgroundColor: '#34C75915', borderColor: '#34C75930' }]}>
            <Ionicons name="calendar" size={18} color="#34C759" />
          </View>
          <View>
            <ThemedText type="defaultSemiBold" style={[styles.title, { color: colors.text }]}>Select a Class</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>Choose a class below to view its timetable</ThemedText>
          </View>
        </View>

        {/* Grid layout */}
        <View style={styles.grid}>
          {classes.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.gridCard,
                { 
                  backgroundColor: colors.backgroundElement, 
                  borderColor: colors.backgroundSelected 
                }
              ]}
              onPress={() => onClassSelect(c.id)}
            >
              <View style={[styles.cardIconBox, { backgroundColor: '#34C75910', borderColor: '#34C75925' }]}>
                <Ionicons name="calendar" size={18} color="#34C759" />
              </View>
              <ThemedText style={[styles.cardLabel, { color: colors.text }]} numberOfLines={1}>
                {c.name}
              </ThemedText>
              <View style={[styles.sectionBadge, { backgroundColor: '#34C75910', borderColor: '#34C75930' }]}>
                <ThemedText style={styles.sectionBadgeText}>{c.section || 'A'}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Fallback when a class is selected, but has no timetable records scheduled
  return (
    <View style={styles.noRecordsContainer}>
      <View style={[styles.noRecordsIconBox, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} style={{ opacity: 0.3 }} />
      </View>
      <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 16 }}>No timetable records found</ThemedText>
      <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 }}>
        {isTeacher 
          ? 'You have no classes scheduled for this day.' 
          : 'Please configure slots using the edit options or check back later.'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%', // roughly 2 columns
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 28,
    alignItems: 'center',
  },
  sectionBadgeText: {
    color: '#34C759',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noRecordsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  noRecordsIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
