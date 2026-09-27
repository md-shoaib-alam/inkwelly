import React from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';

interface OfflineStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
  message?: string;
}

export function OfflineState({ onRetry, isRetrying = false, message }: OfflineStateProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[
        styles.iconWrapper, 
        { 
          backgroundColor: isDark ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.05)',
          borderColor: isDark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)'
        }
      ]}>
        <Ionicons name="cloud-offline" size={56} color="#FF3B30" />
      </View>

      <ThemedText style={styles.title}>Connection Lost</ThemedText>
      
      <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
        {message || 'Unable to connect to the server. Please check your internet connection and try again.'}
      </ThemedText>

      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: '#FF2D55' }]}
        onPress={onRetry}
        disabled={isRetrying}
        activeOpacity={0.8}
      >
        {isRetrying ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 150,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
