import React from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { Portal, Dialog, Button, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../../components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

interface AboutAppModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AboutAppModal({ visible, onDismiss }: AboutAppModalProps) {
  const { activeTheme, apiBaseUrl } = useSettings();
  const colors = Colors[activeTheme];

  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  const features = [
    { icon: 'notifications-outline', text: 'Real-time Push Notifications' },
    { icon: 'sync-outline', text: 'Cloud Data Synchronization' },
    { icon: 'shield-checkmark-outline', text: 'Role-based Secure Access' },
    { icon: 'color-palette-outline', text: 'Adaptive Dark & Light Themes' },
  ];

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={[styles.dialog, { backgroundColor: colors.backgroundElement }]}>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header / Logo Section */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="school" size={40} color="#FFF" />
              </View>
              <ThemedText style={styles.appName}>Drizzelfull LMS</ThemedText>
              <ThemedText style={[styles.versionText, { color: colors.textSecondary }]}>
                Version {appVersion} (Build {buildNumber})
              </ThemedText>
            </View>

            <Divider style={styles.divider} />

            {/* App Description */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Platform Overview</ThemedText>
              <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                A comprehensive School Management System designed to bridge the gap between administrators, teachers, parents, and students.
              </ThemedText>
            </View>

            {/* Key Features */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Key Features</ThemedText>
              {features.map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name={f.icon as any} size={18} color="#007AFF" style={styles.featureIcon} />
                  <ThemedText style={[styles.featureText, { color: colors.text }]}>{f.text}</ThemedText>
                </View>
              ))}
            </View>

            {/* System Info */}
            <View style={[styles.systemInfoCard, { backgroundColor: colors.backgroundSelected + '40' }]}>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Device</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{Device.modelName || 'Unknown Device'}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>OS</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{Platform.OS} {Platform.Version}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>API Endpoint</ThemedText>
                <ThemedText numberOfLines={1} ellipsizeMode="tail" style={[styles.infoValue, { color: '#007AFF', fontSize: 11 }]}>
                  {apiBaseUrl}
                </ThemedText>
              </View>
            </View>

            <View style={styles.footer}>
              <ThemedText style={[styles.copyright, { color: colors.textSecondary }]}>
                © {new Date().getFullYear()} Drizzelfull Technologies
              </ThemedText>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor="#007AFF" onPress={onDismiss} labelStyle={{ fontWeight: '700' }}>
            GOT IT
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 24,
    maxHeight: '80%',
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  versionText: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  divider: {
    marginBottom: 20,
    opacity: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  systemInfoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  copyright: {
    fontSize: 11,
    fontWeight: '600',
  },
});
