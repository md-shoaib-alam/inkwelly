import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

interface FeeSummaryProps {
  totalDue: string;
  paidAmount: string;
  pendingAmount: string;
  nextDueDate: string;
}

export function FeeSummary({ totalDue, paidAmount, pendingAmount, nextDueDate }: FeeSummaryProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <View style={[styles.container, { backgroundColor: '#007AFF' }]}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.label}>Total Pending Balance</ThemedText>
          <ThemedText style={styles.balance}>{pendingAmount}</ThemedText>
        </View>
        <Ionicons name="wallet" size={32} color="rgba(255,255,255,0.3)" />
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <ThemedText style={styles.footerLabel}>Total Paid</ThemedText>
          <ThemedText style={styles.footerValue}>{paidAmount}</ThemedText>
        </View>
        <View style={styles.footerItem}>
          <ThemedText style={styles.footerLabel}>Next Due Date</ThemedText>
          <ThemedText style={styles.footerValue}>{nextDueDate}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
