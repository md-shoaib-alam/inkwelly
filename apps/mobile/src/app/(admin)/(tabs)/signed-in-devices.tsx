import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import {
  listSignedInDevices,
  revokeAllSignedInDevices,
  revokeSignedInDevice,
  type SignedInDevice,
} from '@/lib/api';

function remaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)} days`;
  if (hours >= 1) return `${hours} hours`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min`;
}

export default function SignedInDevicesScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const [devices, setDevices] = useState<SignedInDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setDevices(await listSignedInDevices());
    } catch (err) {
      setError((err as Error).message || 'Could not load your devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const signOneOut = (d: SignedInDevice) => {
    Alert.alert(
      d.current ? 'Sign out of this device?' : 'Sign this device out?',
      d.current
        ? 'This phone stops being able to renew its session, and signs out within 15 minutes.'
        : 'That machine stops renewing. Its current session ends within 15 minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              const { revoked } = await revokeSignedInDevice(d.id);
              if (revoked === 0) Alert.alert('Already signed out', 'That device is no longer in the list.');
              await load();
            } catch (err) {
              Alert.alert('Could not sign it out', (err as Error).message);
            }
          },
        },
      ],
    );
  };

  const signAllOut = () => {
    Alert.alert(
      'Sign out of every device?',
      'Every machine including this one is signed out immediately. You will need your password again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out everywhere',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeAllSignedInDevices();
              await load();
            } catch (err) {
              Alert.alert('Could not sign out', (err as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.screen} safeAreaTop>
      <ScrollView
        contentContainerStyle={styles.padding}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(); }}
            colors={['#007AFF']}
            tintColor={colors.text}
          />
        )}
      >
        <ThemedText type="title">Signed-in devices</ThemedText>
        <ThemedText style={styles.muted}>
          Every machine holding a session for this account. Signing one out stops it renewing;
          the session it already holds ends within 15 minutes.
        </ThemedText>

        {error && (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: '#FF3B30' }]}>
            <ThemedText style={styles.body}>{error}</ThemedText>
            <TouchableOpacity onPress={() => void load()}>
              <ThemedText style={styles.link}>Try again</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {!error && !loading && devices.length === 0 && (
          <ThemedText style={[styles.body, styles.gap]}>No devices are signed in.</ThemedText>
        )}

        {devices.map((d) => (
          <View key={d.id} style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <ThemedText type="defaultSemiBold" style={styles.body}>
              {d.browser} · {d.device}{d.current ? '  (this device)' : ''}
            </ThemedText>
            <ThemedText style={styles.muted}>
              {d.ip ?? 'no address'} · signed in {new Date(d.signedInAt).toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.muted}>last seen {new Date(d.lastSeenAt).toLocaleString()}</ThemedText>
            <ThemedText style={styles.muted}>
              {d.isShared ? 'Shared computer · ' : ''}expires in {remaining(d.expiresAt)}
              {d.known ? '' : ' · recorded before device tracking'}
            </ThemedText>
            <TouchableOpacity style={styles.revoke} onPress={() => signOneOut(d)}>
              <Ionicons name="close-circle-outline" size={16} color="#FF3B30" />
              <ThemedText style={styles.revokeText}>{d.current ? 'Sign out of this device' : 'Sign out'}</ThemedText>
            </TouchableOpacity>
          </View>
        ))}

        {devices.length > 0 && (
          <TouchableOpacity style={styles.revoke} onPress={signAllOut}>
            <Ionicons name="log-out-outline" size={16} color="#FF3B30" />
            <ThemedText style={styles.revokeText}>Sign out of all devices</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padding: { padding: 16, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  body: { fontSize: 14 },
  muted: { fontSize: 12, opacity: 0.65 },
  gap: { marginTop: 8 },
  revoke: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  revokeText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
  link: { color: '#007AFF', fontSize: 14 },
});
