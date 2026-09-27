import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Class } from './types';

interface ClassCardProps {
  item: Class;
  colors: any;
  activeTheme: string;
  isTablet: boolean;
  isAdmin: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewStudents: () => void;
}

export const ClassCard = React.memo(function ClassCard({
  item,
  colors,
  activeTheme,
  isTablet,
  isAdmin,
  onPress,
  onEdit,
  onDelete,
  onViewStudents,
}: ClassCardProps) {
  const percentage = item.capacity > 0 ? (item.studentCount / item.capacity) : 0;
  const percentageText = Math.round(percentage * 100);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.classCard, 
        { 
          backgroundColor: colors.backgroundElement, 
          borderColor: colors.backgroundSelected,
          width: isTablet ? '48.5%' : '100%',
        }
      ]}
    >
      {/* Top Header info */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold" style={[styles.classNameTitle, { color: colors.text }]}>
            {item.name}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: activeTheme === 'dark' ? '#27272A' : '#F3F4F6', alignSelf: 'flex-start', marginTop: 4 }]}>
            <ThemedText style={[styles.badgeText, { color: colors.textSecondary }]}>
              Section {item.section}
            </ThemedText>
          </View>
        </View>

        {/* Action Row */}
        {isAdmin && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              onPress={onEdit} 
              style={[styles.actionBtnCircle, { backgroundColor: '#ECFDF5' }]}
            >
              <Ionicons name="pencil" size={16} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onDelete} 
              style={[styles.actionBtnCircle, { backgroundColor: '#FEF2F2' }]}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.infoMeta}>
          <Ionicons name="people-outline" size={16} color="#10B981" style={{ marginRight: 6 }} />
          <View>
            <ThemedText style={styles.statLabel}>Students</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.text }]}>
              {item.studentCount} <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>/ {item.capacity}</ThemedText>
            </ThemedText>
          </View>
        </View>

        <View style={styles.infoMeta}>
          <Ionicons name="person-outline" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.statLabel}>Class Teacher</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
              {item.classTeacher || 'Unassigned'}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarSection}>
        <View style={styles.progressBarHeader}>
          <ThemedText style={styles.progressBarLabel}>Capacity</ThemedText>
          <ThemedText style={[styles.progressBarPercent, { color: percentage >= 0.9 ? '#EF4444' : '#10B981' }]}>
            {percentageText}% Full
          </ThemedText>
        </View>
        <ProgressBar 
          progress={percentage} 
          color={percentage >= 0.9 ? '#EF4444' : (percentage >= 0.75 ? '#F59E0B' : '#10B981')} 
          style={styles.progressBar}
        />
      </View>

      {/* View Students CTA */}
      <TouchableOpacity 
        style={[styles.viewStudentsBtn, { backgroundColor: activeTheme === 'dark' ? '#27272A' : '#ECFDF5' }]}
        onPress={onViewStudents}
      >
        <Ionicons name="eye-outline" size={14} color="#10B981" style={{ marginRight: 6 }} />
        <ThemedText style={{ color: '#10B981', fontWeight: 'bold', fontSize: 12 }}>View Students</ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  classCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  classNameTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  infoMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  progressBarSection: {
    marginTop: 14,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBarLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  progressBarPercent: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  viewStudentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 8,
    marginTop: 14,
  },
});
