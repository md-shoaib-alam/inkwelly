import React from 'react';
import { StyleSheet, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

interface ClassInfo {
  id: string;
  name: string;
  section: string;
}

interface SelectClassGridProps {
  colors: any;
  classes: ClassInfo[];
  onClassSelect: (id: string) => void;
}

export function SelectClassGrid({
  colors,
  classes = [],
  onClassSelect,
}: SelectClassGridProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 650;

  return (
    <View style={styles.container}>
      {/* Banner header */}
      <View style={styles.bannerRow}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 122, 255, 0.08)', borderColor: 'rgba(0, 122, 255, 0.15)' }]}>
          <Ionicons name="book" size={18} color="#007AFF" />
        </View>
        <View>
          <ThemedText type="defaultSemiBold" style={[styles.title, { color: colors.text }]}>Select a Class</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>Choose a class below to view its subjects</ThemedText>
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
                borderColor: colors.backgroundSelected,
                width: (width - 32 - 12) / 2,
              }
            ]}
            onPress={() => onClassSelect(c.id)}
          >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(0, 122, 255, 0.05)', borderColor: 'rgba(0, 122, 255, 0.1)' }]}>
              <Ionicons name="school" size={18} color="#007AFF" />
            </View>
            <ThemedText style={[styles.cardLabel, { color: colors.text }]} numberOfLines={1}>
              {c.name}
            </ThemedText>
            <View style={[styles.sectionBadge, { backgroundColor: 'rgba(0, 122, 255, 0.08)', borderColor: 'rgba(0, 122, 255, 0.15)' }]}>
              <ThemedText style={styles.sectionBadgeText}>{c.section || 'A'}</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
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
    color: '#007AFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
