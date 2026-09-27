import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function ChatPromo({ colors }: { colors: any }) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#3B82F6', '#82F3FF']} style={styles.iconContainer}>
        <Ionicons name="chatbubbles" size={32} color="#0F2042" />
      </LinearGradient>
      <ThemedText style={styles.title} type="defaultSemiBold">Direct Teacher Chat</ThemedText>
      <ThemedText style={[styles.desc, { color: colors.textSecondary }]}>
        Connect directly with class teachers in real-time. Chat instantly, coordinate help, and stay in sync.
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
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginBottom: 20 },
});
