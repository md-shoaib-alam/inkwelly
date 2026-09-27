import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

export default function IosSubscription() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="logo-apple" size={48} color={activeTheme === 'dark' ? '#FFF' : '#000'} />
          <Ionicons name="ban-outline" size={24} color="#FF3B30" style={styles.badge} />
        </View>
        
        <ThemedText style={styles.title} type="defaultSemiBold">
          iOS Subscriptions Disabled
        </ThemedText>
        
        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
          In-app subscription purchase is currently unavailable on iOS devices in accordance with local platform policies.
        </ThemedText>

        <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" style={{ marginRight: 8, marginTop: 2 }} />
          <ThemedText style={[styles.infoText, { color: colors.text }]}>
            If you already have an active subscription, your premium benefits will still be active here. To subscribe, please use our web portal or an Android device.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
