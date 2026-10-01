import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, Pressable,
  StyleSheet, TextInput, TouchableOpacity, View,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useAuth } from '@/store/auth-context';
import { useRouter } from 'expo-router';
import {
  approvalErrorMessage,
  approveChallengeByCode,
  approveChallengeById,
  getChallengeRequest,
  type ChallengeApproval,
  type ChallengeRequestInfo,
} from '@/lib/api';

const CHALLENGE_PREFIX = 'inkwelly://login?c=';
const CODE_PATTERN = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}-?[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}$/i;
const CHALLENGE_TTL_MS = 90_000;

const NAVY = '#0B1220';
const TEAL = '#0D9488';

type Mode = 'camera' | 'code' | 'confirm' | 'success';

function parseChallengeId(data: string): string | null {
  if (!data.startsWith(CHALLENGE_PREFIX)) return null;
  const id = data.slice(CHALLENGE_PREFIX.length).trim();
  return /^[A-Za-z0-9_-]{16,64}$/.test(id) ? id : null;
}

function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function InfoRow({ label, icon, value, muted }: { label: string; icon: keyof typeof Ionicons.glyphMap; value: string; muted: string }) {
  return (
    <View style={rowStyles.row}>
      <ThemedText style={[rowStyles.label, { color: muted }]}>{label}</ThemedText>
      <View style={rowStyles.valueWrap}>
        <Ionicons name={icon} size={16} color={muted} />
        <ThemedText type="defaultSemiBold" numberOfLines={1} style={rowStyles.value}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9 },
  label: { fontSize: 14 },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1, maxWidth: '68%' },
  value: { fontSize: 14 },
});

export default function SignInOnWebScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('camera');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<ChallengeRequestInfo | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [signedInBrowser, setSignedInBrowser] = useState('That computer');

  // Same contract as TeacherQRScanModal: opening the screen asks once, so the preview
  // starts without the user hunting for a button. A ref keeps a denial from re-prompting
  // in a loop — the placeholder button is the manual retry path.
  const permissionAsked = useRef(false);
  useEffect(() => {
    if (!permissionAsked.current && permission && !permission.granted && permission.canAskAgain) {
      permissionAsked.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const openCameraAccess = () => {
    if (permission?.canAskAgain) {
      void requestPermission();
    } else {
      void Linking.openSettings();
    }
  };

  const browserLabel = requestInfo
    ? `${requestInfo.browser} on ${requestInfo.os}`
    : 'That computer';

  const closeSheet = () => {
    setMode('camera');
    setChallengeId(null);
    setRequestInfo(null);
    setCode('');
    setBusy(false);
  };

  const expiresAt = requestInfo ? new Date(requestInfo.createdAt).getTime() + CHALLENGE_TTL_MS : 0;
  const remainingMs = expiresAt - now;

  useEffect(() => {
    if (mode !== 'confirm' || !requestInfo) return;
    const deadline = new Date(requestInfo.createdAt).getTime() + CHALLENGE_TTL_MS;
    const t = setInterval(() => {
      const nowMs = Date.now();
      setNow(nowMs);
      if (nowMs >= deadline) {
        clearInterval(t);
        setMode('camera');
        setChallengeId(null);
        setRequestInfo(null);
        setCode('');
        Alert.alert('Code expired', 'Show a new code on the computer and scan it again.');
      }
    }, 1000);
    return () => clearInterval(t);
  }, [mode, requestInfo]);

  const confirmChallenge = async (id: string) => {
    setBusy(true);
    try {
      setRequestInfo(await getChallengeRequest(id));
      setChallengeId(id);
      setNow(Date.now());
      setMode('confirm');
    } catch {
      Alert.alert('Code expired', 'Show a new code on the computer and scan it again.');
    } finally {
      setBusy(false);
    }
  };

  const onScanned = (result: BarcodeScanningResult) => {
    const id = parseChallengeId(result.data);
    if (!id) {
      Alert.alert('Not a sign-in code', 'This QR code is not for signing in on web.');
      return;
    }
    void confirmChallenge(id);
  };

  const approve = async (run: () => Promise<ChallengeApproval>, label: string) => {
    setBusy(true);
    try {
      await run();
      setSignedInBrowser(label);
      setMode('success');
      setCode('');
    } catch (err) {
      Alert.alert('Could not sign in', approvalErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitCodeOnly = () => {
    if (!CODE_PATTERN.test(code.trim())) {
      Alert.alert('Wrong format', 'The code is 6 characters, like 2JR-YMP.');
      return;
    }
    void approve(() => approveChallengeByCode(code.trim()), 'That computer');
  };

  const approveScanned = () => {
    if (!challengeId) return;
    if (!CODE_PATTERN.test(code.trim())) {
      Alert.alert('Type the code', 'Enter the 6 characters shown beside the QR code.');
      return;
    }
    void approve(() => approveChallengeById(challengeId, code.trim()), browserLabel);
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <ThemedText type="title" style={styles.headerTitle}>Sign in on web</ThemedText>
      <View style={{ width: 40 }} />
    </View>
  );

  // ─ Success screen ───────────────────────────────────────────────────
  if (mode === 'success') {
    return (
      <ThemedView style={styles.screen} safeAreaTop>
        <View style={styles.center}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={38} color="#fff" />
          </View>
          <ThemedText type="title" style={styles.centerText}>{"You're signed in"}</ThemedText>
          <ThemedText style={[styles.body, styles.centerText, { color: colors.textSecondary }]}>
            {`${signedInBrowser} is now signed in to your account.`}
          </ThemedText>
          <View style={[styles.successCard, { backgroundColor: colors.backgroundElement }]}>
            <Ionicons name="desktop-outline" size={22} color={TEAL} />
            <ThemedText style={styles.cardText}>
              Head back to your computer — it should have opened already.
            </ThemedText>
          </View>
          <TouchableOpacity style={[styles.primary, styles.spacer]} onPress={() => router.back()}>
            <ThemedText style={styles.primaryText}>Done</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeSheet} style={styles.spacer}>
            <ThemedText style={[styles.link, { color: TEAL }]}>
              <Ionicons name="scan-outline" size={15} color={TEAL} />  Scan another code
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // ── Code entry sheet over camera ─────────────────────────────────────
  if (mode === 'code') {
    return (
      <KeyboardAvoidingView style={[styles.screen, { backgroundColor: NAVY }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {permission?.granted && (
          <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={busy ? undefined : onScanned} />
        )}
        {renderHeader()}
        <View style={styles.scrim}>
          <View style={[styles.codeSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <ThemedText type="title" style={styles.sheetTitle}>Enter the sign-in code</ThemedText>
            <ThemedText style={[styles.sheetBody, { color: colors.textSecondary }]}>
              It is the six characters shown under the QR code on your computer.
            </ThemedText>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(formatCode(t))}
              placeholder="K7M-4QP"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              textAlign="center"
              autoFocus
              style={[styles.codeInput, { borderColor: TEAL, color: colors.text, backgroundColor: colors.backgroundElement }]}
            />
            <TouchableOpacity
              style={[styles.primary, styles.spacer, busy && styles.disabled]}
              onPress={submitCodeOnly}
              disabled={busy}
            >
              <ThemedText style={styles.primaryText}>{busy ? 'Signing in…' : 'Continue'}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('camera')} style={styles.spacer}>
              <ThemedText style={[styles.link, { color: TEAL }]}>Scan the code instead</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Confirm bottom sheet ─────────────────────────────────────────────
  if (mode === 'confirm') {
    return (
      <KeyboardAvoidingView style={[styles.screen, { backgroundColor: NAVY }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {permission?.granted && (
          <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} />
        )}
        {renderHeader()}
        <View style={styles.scrim}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetIconCircle}>
              <Ionicons name="desktop-outline" size={24} color="#fff" />
            </View>
            <ThemedText type="title" style={styles.centerText}>Sign in on the web?</ThemedText>
            <ThemedText style={[styles.body, styles.centerText, { color: colors.textSecondary }]}>
              A computer is asking to open your Inkwelly account.
            </ThemedText>
            <View style={[styles.card, styles.spacer, { backgroundColor: colors.backgroundElement }]}>
              <InfoRow label="Browser" icon="globe-outline" value={browserLabel} muted={colors.textSecondary} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <InfoRow label="From" icon="eye-outline" value={requestInfo?.ip ?? 'Unknown address'} muted={colors.textSecondary} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <InfoRow label="Account" icon="person-outline" value={user?.name ?? '\u2014'} muted={colors.textSecondary} />
            </View>
            <View style={styles.shieldRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} style={styles.shieldIcon} />
              <ThemedText style={[styles.muted, { color: colors.textSecondary }]}>
                {`Only continue if you opened the login page yourself. Expires in ${formatCountdown(remainingMs)}.`}
              </ThemedText>
            </View>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(formatCode(t))}
              placeholder="2JR-YMP"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              textAlign="center"
              autoFocus
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundElement }]}
            />
            <View style={[styles.buttonRow, styles.spacer]}>
              <Pressable
                style={[styles.notMe, { borderColor: colors.danger }]}
                onPress={closeSheet}
                disabled={busy}
              >
                <ThemedText style={[styles.notMeText, { color: colors.danger }]}>Not me</ThemedText>
              </Pressable>
              <TouchableOpacity
                style={[styles.yesSignIn, busy && styles.disabled]}
                onPress={approveScanned}
                disabled={busy}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <ThemedText style={styles.primaryText}>{busy ? 'Signing in…' : 'Yes, sign in'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Camera / Scan mode ───────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: NAVY }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {renderHeader()}
      <View style={styles.cameraContainer}>
        {!permission ? (
          <View style={styles.cameraPlaceholder}>
            <ActivityIndicator size="large" color="#fff" />
            <ThemedText style={styles.cameraPlaceholderText}>Requesting camera…</ThemedText>
          </View>
        ) : !permission.granted ? (
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.3)" />
            <ThemedText style={styles.cameraPlaceholderText}>
              {permission.canAskAgain
                ? 'Camera access is turned off for this app.'
                : 'Camera access is blocked. Allow it in Settings, then come back.'}
            </ThemedText>
            <TouchableOpacity style={styles.allowCameraBtn} onPress={openCameraAccess}>
              <ThemedText style={styles.allowCameraText}>
                {permission.canAskAgain ? 'Allow camera' : 'Open Settings'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={busy ? undefined : onScanned}
            />
            <View style={styles.scanFrameOverlay} pointerEvents="none">
              <View style={styles.scanFrame} />
            </View>
            {busy && (
              <View style={styles.busyTint}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </>
        )}
      </View>
      <View style={[styles.cameraFooter, { paddingBottom: insets.bottom + 16 }]}>
        <ThemedText style={styles.cameraCaption}>
          Open app.inkwelly.com on your computer and point the camera at the code it shows.
        </ThemedText>
        <TouchableOpacity onPress={() => setMode('code')} style={styles.codeLink}>
          <ThemedText style={[styles.link, { color: TEAL }]}>
            <Ionicons name="keypad-outline" size={16} color={TEAL} />  Enter the code instead
          </ThemedText>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  centerText: { textAlign: 'center' },
  body: { fontSize: 14 },
  muted: { fontSize: 13 },
  spacer: { marginTop: 12 },
  disabled: { opacity: 0.6 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, backgroundColor: NAVY },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  cameraContainer: { flex: 1, minHeight: 240, marginHorizontal: 16, marginTop: 8, borderRadius: 28, overflow: 'hidden', position: 'relative' },
  scanFrameOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 230, height: 230, borderRadius: 26, borderWidth: 5, borderColor: 'rgba(255,255,255,0.95)' },
  busyTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  cameraPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.2)' },
  cameraPlaceholderText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  allowCameraBtn: { backgroundColor: TEAL, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  allowCameraText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cameraFooter: { paddingHorizontal: 24, paddingTop: 16, gap: 12, alignItems: 'center', backgroundColor: NAVY },
  cameraCaption: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  codeLink: { paddingVertical: 4 },

  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 26 },
  codeSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 32 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  sheetBody: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  sheetIconCircle: { alignSelf: 'center', width: 52, height: 52, borderRadius: 26, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  card: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
  successCard: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginTop: 8 },
  cardText: { fontSize: 14, flex: 1 },
  divider: { height: 1 },
  shieldRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 14 },
  shieldIcon: { marginTop: 2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 20, letterSpacing: 4, marginTop: 14 },
  codeInput: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 22, letterSpacing: 6, fontFamily: 'monospace' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  notMe: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: 'transparent' },
  notMeText: { fontWeight: '700', fontSize: 15 },
  yesSignIn: { flex: 1.4, backgroundColor: TEAL, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  primary: { backgroundColor: TEAL, borderRadius: 14, paddingVertical: 14, alignItems: 'center', alignSelf: 'stretch' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { fontSize: 14, textAlign: 'center' },
  successCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
