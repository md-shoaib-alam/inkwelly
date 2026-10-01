import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useAuth } from '@/store/auth-context';
import { useRouter } from 'expo-router';
import {
  listSignedInDevices,
  revokeAllSignedInDevices,
  revokeSignedInDevice,
  type SignedInDevice,
} from '@/lib/api';

type Tab = 'devices' | 'history' | 'pin';

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h ago`;
  const days = Math.floor(ms / 86_400_000);
  return days === 1 ? '1 d ago' : `${days} d ago`;
}

export default function SignedInDevicesScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('devices');
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

  // eslint-disable-next-line
  useEffect(() => { void load(); }, []);

  const signOneOut = useCallback((d: SignedInDevice) => {
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
  }, [load]);

  const signAllOut = useCallback(() => {
    const otherCount = devices.filter((dd) => !dd.current).length;
    Alert.alert(
      `Log out all other devices (${otherCount})?`,
      'Every machine except this one is signed out immediately. They will need their password again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out others',
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
  }, [devices, load]);

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <ThemedText type="title" style={styles.headerTitle}>Security & devices</ThemedText>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {(['devices', 'history', 'pin'] as Tab[]).map((t) => (
        <TouchableOpacity key={t} onPress={() => setTab(t)} style={styles.tabItem}>
          <ThemedText style={[styles.tabLabel, tab === t && styles.activeTabLabel, { color: tab === t ? TEAL : colors.textSecondary }]}>
            {t === 'devices' ? 'Devices' : t === 'history' ? 'Login history' : 'Transaction PIN'}
          </ThemedText>
          {tab === t && <View style={[styles.tabIndicator, { backgroundColor: TEAL }]} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUserInfo = () => (
    <View style={styles.userInfo}>
      <View style={styles.avatarCircle}>
        <Ionicons name="shield-checkmark-outline" size={22} color={TEAL} />
      </View>
      <View style={styles.userInfoText}>
        <ThemedText type="defaultSemiBold" style={styles.userName}>{user?.name ?? '—'}</ThemedText>
        <ThemedText style={styles.userPhone}>{user?.phone || user?.email || '\u2014'}</ThemedText>
      </View>
    </View>
  );

  const renderDescription = () => (
    <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
      {"These are the devices currently signed in to your account. Sign out any you don\u2019t recognise."}
    </ThemedText>
  );

  const renderDeviceCard = useCallback((d: SignedInDevice) => {
    // The server derives device/browser/os from the stored UA; guessing again here is
    // how an okhttp phone session once rendered as "Desktop".
    const isMobileDevice = d.device === 'Mobile';
    const isCurrent = d.current;
    const lastSeenMs = new Date(d.lastSeenAt).getTime();
    const now = Date.now();
    const isOnline = isCurrent || now - lastSeenMs < 300_000;

    const metaParts: string[] = [d.device];
    if (d.ip) metaParts.push(d.ip);
    const timeStr = isOnline ? 'Active now' : `Last seen ${timeAgo(d.lastSeenAt)}`;

    return (
      <View key={d.id} style={[styles.deviceCard, isCurrent && styles.currentDeviceCard]}>
        <View style={styles.cardIconWrap}>
          <Ionicons name={isMobileDevice ? 'phone-portrait-outline' : 'desktop-outline'} size={20} color="#8c6b2d" />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <ThemedText style={styles.cardDeviceName} numberOfLines={1}>
              {`${d.browser} on ${d.os}`}
            </ThemedText>
            {isCurrent && (
              <View style={styles.thisDeviceBadge}>
                <ThemedText style={styles.thisDeviceBadgeText}>This device</ThemedText>
              </View>
            )}
            {d.isShared && (
              <View style={styles.scannedBadge}>
                <Ionicons name="qr-code-outline" size={11} color="#64748b" />
                <ThemedText style={styles.scannedBadgeText}>Scanned</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.cardMeta}>{metaParts.join(' · ')}</ThemedText>
          <ThemedText style={styles.cardTime}>{timeStr}</ThemedText>
        </View>
        <TouchableOpacity onPress={() => signOneOut(d)} disabled={isCurrent}>
          <ThemedText style={[styles.logoutLink, isCurrent && styles.disabledLink]}>
            {isCurrent ? 'Sign out' : 'Log out'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }, [signOneOut]);

  const renderDevicesTab = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} colors={['#edb449']} tintColor={colors.text} />
      }
    >
      {renderUserInfo()}
      {renderDescription()}
      {error && (
        <View style={[styles.errorCard, { backgroundColor: colors.backgroundElement }]}>
          <ThemedText style={styles.body}>{error}</ThemedText>
          <TouchableOpacity onPress={() => void load()}>
            <ThemedText style={styles.link}>Try again</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {!error && !loading && devices.length === 0 && (
        <ThemedText style={[styles.body, styles.gap]}>No active devices found.</ThemedText>
      )}
      {devices.map(renderDeviceCard)}
      {devices.length > 1 && (
        <TouchableOpacity style={styles.logoutAllBtn} onPress={signAllOut}>
          <Ionicons name="log-out-outline" size={18} color="#a8341f" />
          <ThemedText style={styles.logoutAllText}>
            Log out all other devices ({devices.filter((d) => !d.current).length})
          </ThemedText>
        </TouchableOpacity>
      )}
      <View style={styles.infoNote}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} style={styles.infoIcon} />
          <ThemedText style={styles.infoText}>
            {"A signed-out device loses access right away \u2014 the next time it tries to do anything, it is signed out."}
          </ThemedText>
      </View>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedText style={[styles.body, { textAlign: 'center', marginTop: 40, color: colors.textSecondary }]}>
        Login history coming soon.
      </ThemedText>
    </ScrollView>
  );

  const renderPinTab = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedText style={[styles.body, { textAlign: 'center', marginTop: 40, color: colors.textSecondary }]}>
        Transaction PIN settings coming soon.
      </ThemedText>
    </ScrollView>
  );

  return (
    <ThemedView style={styles.screen}>
      {renderHeader()}
      {renderTabs()}
      {tab === 'devices' && renderDevicesTab()}
      {tab === 'history' && renderHistoryTab()}
      {tab === 'pin' && renderPinTab()}
    </ThemedView>
  );
}

const TEAL = '#0D9488';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  activeTabLabel: { fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 3, borderRadius: 2 },
  scrollContent: { padding: 16, gap: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' },
  userInfoText: { gap: 2 },
  userName: { fontSize: 16, fontWeight: '700' },
  userPhone: { fontSize: 13, color: '#64748b' },
  description: { fontSize: 14, lineHeight: 20 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', gap: 12 },
  currentDeviceCard: { borderColor: '#edb449', borderWidth: 2 },
  cardIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#faf7ed', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#14312a10' },
  cardContent: { flex: 1, minWidth: 0, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardDeviceName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  thisDeviceBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: '#fde68a' },
  thisDeviceBadgeText: { fontSize: 11, fontWeight: '700', color: '#8a5d11' },
  scannedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  scannedBadgeText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  cardMeta: { fontSize: 12, color: '#64748b' },
  cardTime: { fontSize: 12, color: '#64748b' },
  logoutLink: { color: '#a8341f', fontSize: 13, fontWeight: '700' },
  disabledLink: { opacity: 0.4 },
  logoutAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#ffffff' },
  logoutAllText: { color: '#a8341f', fontSize: 14, fontWeight: '700' },
  infoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  infoIcon: { marginTop: 2 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  errorCard: { borderRadius: 12, borderWidth: 1, borderColor: '#FF3B30', padding: 14, gap: 4 },
  body: { fontSize: 14 },
  gap: { marginTop: 8 },
  link: { color: '#007AFF', fontSize: 14 },
});
