import React from 'react';
import { StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

export default function WebVersionScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const handleOpenWeb = () => {
    Linking.openURL('https://startintern.in');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="desktop-outline" size={64} color="#007AFF" />
        </View>
        
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Super Admin Console
        </ThemedText>
        
        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
          To manage school tenants, platform subscriptions, and global system configuration, please log in to the web console on a desktop computer.
        </ThemedText>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleOpenWeb}
          activeOpacity={0.8}
        >
          <Ionicons name="globe-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <ThemedText style={styles.buttonText}>Open startintern.in</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#007AFF',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
