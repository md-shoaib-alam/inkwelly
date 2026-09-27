import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function ReceiptsPromo({ colors }: { colors: any }) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10B981', '#6EE7B7']} style={styles.iconContainer}>
        <Ionicons name="document-text" size={32} color="#FFFFFF" />
      </LinearGradient>
      <ThemedText style={styles.title} type="defaultSemiBold">Fee Receipt Exports</ThemedText>
      <ThemedText style={[styles.desc, { color: colors.textSecondary }]}>
        Instantly download statements, export PDFs, and print fee receipts for tax records and reimbursement claims.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  iconContainer: { 
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginBottom: 20 },
});
