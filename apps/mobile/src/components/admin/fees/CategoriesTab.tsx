import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { FeeCategory } from './types';

interface CategoriesTabProps {
  colors: any;
  categories: FeeCategory[];
  setCategoryDialogVisible: (v: boolean) => void;
  resetCategoryForm: () => void;
}

export function CategoriesTab({
  colors,
  categories,
  setCategoryDialogVisible,
  resetCategoryForm
}: CategoriesTabProps) {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Fee Categories</ThemedText>
        <TouchableOpacity style={styles.tabActionBtn} onPress={() => { resetCategoryForm(); setCategoryDialogVisible(true); }}>
          <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 4 }} />
          <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>Create</ThemedText>
        </TouchableOpacity>
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={{ color: colors.textSecondary }}>No fee categories created yet.</ThemedText>
        </View>
      ) : (
        categories.map((c) => (
          <View key={c.id} style={[styles.categoryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{c.name}</ThemedText>
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>Code: {c.code} | Cycle: {c.frequency.toUpperCase()}</ThemedText>
              </View>
              <View style={[styles.frequencyBadge, { backgroundColor: colors.backgroundSelected }]}>
                <ThemedText style={{ fontSize: 10, color: colors.textSecondary, fontWeight: 'bold' }}>{c.frequency.toUpperCase()}</ThemedText>
              </View>
            </View>
            {c.description ? (
              <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>{c.description}</ThemedText>
            ) : null}
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
  categoryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  frequencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
