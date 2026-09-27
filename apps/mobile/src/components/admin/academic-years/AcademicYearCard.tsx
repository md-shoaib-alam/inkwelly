import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AcademicYear } from './types';

interface AcademicYearCardProps {
  item: AcademicYear;
  colors: any;
  activeTheme: string;
  isAdmin: boolean;
  onSetCurrent: (id: string) => void;
  onEdit: (year: AcademicYear) => void;
  onDeleteClick: (id: string) => void;
}

export const AcademicYearCard = React.memo(function AcademicYearCard({
  item,
  colors,
  activeTheme,
  isAdmin,
  onSetCurrent,
  onEdit,
  onDeleteClick,
}: AcademicYearCardProps) {
  const isActive = item.status === 'active';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={[styles.yearCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
      <View style={styles.yearMainInfo}>
        <View style={styles.yearTitleRow}>
          <ThemedText style={[styles.yearName, { color: colors.text }]}>
            {item.name}
          </ThemedText>
          
          <View style={styles.badgeContainer}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: isActive ? (activeTheme === 'dark' ? '#34C75925' : '#E8F8EE') : (activeTheme === 'dark' ? '#8E8E9325' : '#F2F2F7') }]}>
              <ThemedText style={{ color: isActive ? '#34C759' : '#8E8E93', fontSize: 10, fontWeight: '700' }}>
                {item.status.toUpperCase()}
              </ThemedText>
            </View>

            {/* Current Badge */}
            {item.isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: '#5856D6' }]}>
                <ThemedText style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>CURRENT</ThemedText>
              </View>
            )}
          </View>
        </View>

        <ThemedText style={[styles.yearDates, { color: colors.textSecondary }]}>
          {formatDate(item.startDate)} — {formatDate(item.endDate)}
        </ThemedText>
      </View>

      {/* Divider Line */}
      <View style={[styles.cardDivider, { backgroundColor: colors.backgroundSelected }]} />

      {/* Actions */}
      <View style={styles.cardActionsRow}>
        {!item.isCurrent && isAdmin && (
          <TouchableOpacity 
            style={[styles.actionTextBtn, { borderColor: '#5856D6' }]}
            onPress={() => onSetCurrent(item.id)}
          >
            <ThemedText style={{ color: '#5856D6', fontSize: 11, fontWeight: '700' }}>Set Current</ThemedText>
          </TouchableOpacity>
        )}
        {isAdmin && (
          <View style={styles.cardIconActions}>
            <TouchableOpacity style={styles.cardIconBtn} onPress={() => onEdit(item)}>
              <Ionicons name="create" size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardIconBtn} onPress={() => onDeleteClick(item.id)}>
              <Ionicons name="trash" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  yearCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  yearMainInfo: {
    marginBottom: 12,
  },
  yearTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  yearName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  yearDates: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
    opacity: 0.6,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionTextBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardIconActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cardIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
});
