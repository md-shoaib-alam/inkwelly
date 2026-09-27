import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function AiPromo({ colors }: { colors: any }) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#8B5CF6', '#D946EF']} style={styles.iconContainer}>
        <Ionicons name="analytics" size={32} color="#FFFFFF" />
      </LinearGradient>
      <ThemedText style={styles.title} type="defaultSemiBold">AI Student Insights</ThemedText>
      <ThemedText style={[styles.desc, { color: colors.textSecondary }]}>
        Unlock powerful AI performance analytics, automatic grade progress tracking, and key growth predictions.
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginBottom: 20 },
});
