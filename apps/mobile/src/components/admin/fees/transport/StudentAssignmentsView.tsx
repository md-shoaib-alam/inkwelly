import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface StudentAssignmentsViewProps {
  colors: any;
  assignments: any[];
  onAddAssignment: () => void;
  onEditAssignment: (assignment: any) => void;
  onDeleteAssignment: (id: string) => void;
}

export function StudentAssignmentsView({
  colors,
  assignments,
  onAddAssignment,
  onEditAssignment,
  onDeleteAssignment,
}: StudentAssignmentsViewProps) {
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.sectionHeader}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Route Assignments</ThemedText>
        <TouchableOpacity style={styles.addBtn} onPress={onAddAssignment}>
          <Ionicons name="person-add" size={15} color="#FFF" style={{ marginRight: 4 }} />
          <ThemedText style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Assign Student</ThemedText>
        </TouchableOpacity>
      </View>

      {assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={{ color: colors.textSecondary }}>No student route assignments found.</ThemedText>
        </View>
      ) : (
        assignments.map(a => (
          <View key={a.id} style={[styles.itemCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{a.studentName}</ThemedText>
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                  Route: {a.routeName} {a.pickupPoint ? `(${a.pickupPoint})` : ''}
                </ThemedText>
                <ThemedText style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>
                  Class: {a.className} | Start: {a.startDate?.split('T')[0]}
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}
                  onPress={() => onEditAssignment(a)}
                >
                  <Ionicons name="create-outline" size={14} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}
                  onPress={() => onDeleteAssignment(a.id)}
                >
                  <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
