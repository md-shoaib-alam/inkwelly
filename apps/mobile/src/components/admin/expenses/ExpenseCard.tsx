import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ExpenseInfo } from './types';

interface ExpenseCardProps {
  item: ExpenseInfo;
  colors: any;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const statusColors = {
  paid: { bg: '#34C75915', text: '#34C759' },
  pending: { bg: '#FF950015', text: '#FF9500' },
  draft: { bg: '#8E8E9315', text: '#8E8E93' },
};

export function ExpenseCard({ item, colors, isAdmin, onEdit, onDelete }: ExpenseCardProps) {
  const statusStyle = statusColors[item.status] || statusColors.draft;

  return (
    <View style={[styles.expenseCard, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <ThemedText style={styles.categoryName}>
            {item.category?.name || 'Uncategorized'}
          </ThemedText>
          <ThemedText style={[styles.expenseDate, { color: colors.textSecondary }]}>
            {item.date}
          </ThemedText>
        </View>
        <ThemedText style={[styles.amountText, { color: '#FF3B30' }]}>
          ₹{item.amount.toLocaleString()}
        </ThemedText>
      </View>

      {item.description && (
        <ThemedText style={[styles.descText, { color: colors.textSecondary }]}>
          {item.description}
        </ThemedText>
      )}

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <ThemedText style={[styles.statusBadgeText, { color: statusStyle.text }]}>
            {item.status.toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText style={[styles.paymentMethodText, { color: colors.textSecondary }]}>
          {item.paymentMethod.toUpperCase()} {item.referenceNo ? `(${item.referenceNo})` : ''}
        </ThemedText>
      </View>

      {isAdmin && (
        <View style={[styles.cardActions, { borderTopColor: colors.backgroundSelected }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
            <Ionicons name="create-outline" size={16} color="#007AFF" />
            <ThemedText style={styles.actionBtnTextBlue}>Edit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <ThemedText style={styles.actionBtnTextRed}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  expenseCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseDate: {
    fontSize: 12,
    marginTop: 2,
  },
  amountText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  descText: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentMethodText: {
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  actionBtnTextBlue: {
    color: '#007AFF',
    marginLeft: 6,
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionBtnTextRed: {
    color: '#FF3B30',
    marginLeft: 6,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
