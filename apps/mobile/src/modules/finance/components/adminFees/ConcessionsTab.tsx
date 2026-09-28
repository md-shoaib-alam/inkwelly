import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Concession } from './types';

interface ConcessionsTabProps {
  colors: any;
  concessions: Concession[];
  setConcessionDialogVisible: (v: boolean) => void;
  resetConcessionForm: () => void;
  handleDeleteConcession: (id: string) => void;
}

export function ConcessionsTab({
  colors,
  concessions,
  setConcessionDialogVisible,
  resetConcessionForm,
  handleDeleteConcession
}: ConcessionsTabProps) {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Active Student Concessions</ThemedText>
        <TouchableOpacity style={styles.tabActionBtn} onPress={() => { resetConcessionForm(); setConcessionDialogVisible(true); }}>
          <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 4 }} />
          <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>Add</ThemedText>
        </TouchableOpacity>
      </View>

      {concessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={{ color: colors.textSecondary }}>No student concessions granted.</ThemedText>
        </View>
      ) : (
        concessions.map((c) => (
          <View key={c.id} style={[styles.concessionCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <View style={styles.concessionHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{c.studentName}</ThemedText>
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>Class: {c.studentClass} | {c.feeCategoryName}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => handleDeleteConcession(c.id)}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <View style={styles.concessionBody}>
              <View style={[styles.concessionValueBadge, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
                <ThemedText style={{ color: '#2563EB', fontSize: 12, fontWeight: 'bold' }}>
                  {c.concessionType === 'percentage' ? `${c.amount}% Off` : `₹${c.amount} Off`}
                </ThemedText>
              </View>
              <ThemedText style={{ fontSize: 12, color: colors.textSecondary, flex: 1, marginLeft: 10 }} numberOfLines={1}>
                Reason: "{c.reason}"
              </ThemedText>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginVertical: 12,
  },
  tabActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  concessionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  concessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  concessionBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  concessionValueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
