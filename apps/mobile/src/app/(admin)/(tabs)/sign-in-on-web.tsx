import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Alert, Animated, Easing, Keyboard, Linking, PanResponder, Platform,
  Pressable, StyleSheet, TextInput, TouchableOpacity, View,
  type KeyboardEvent, type StyleProp, type ViewStyle,
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
  approveChallengeById,
  getChallengeRequest,
  getChallengeRequestByCode,
  type ChallengeApproval,
  type ChallengeRequestInfo,
} from '@/lib/api';

const CHALLENGE_PREFIX = 'inkwelly://login?c=';
const CODE_PATTERN = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}-?[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}$/i;
const CHALLENGE_TTL_MS = 90_000;

const TEAL = '#0D9488';

// A drag only becomes a dismiss attempt below these, so a tap on the input or a button
// never turns into a closing gesture.
const DRAG_GRADIENT = 14;
const DRAG_CLOSE_DISTANCE = 110;
const DRAG_CLOSE_VELOCITY = 0.5;

type Mode = 'camera' | 'code' | 'confirm' | 'success';

interface PendingChallenge {
  id: string;
  code: string;
}

/**
 * The QR carries both halves: `c` is the challenge id, `k` the six-character code, so a
 * scan alone proves presence at the machine and the confirm sheet needs no retyping.
 * Payloads without `k` (an older web tab) still parse; approvePending routes those to
 * the typed-code fallback instead of posting a code it never saw.
 */
function parseChallengePayload(data: string): PendingChallenge | null {
  if (!data.startsWith(CHALLENGE_PREFIX)) return null;
  const m = data.slice(CHALLENGE_PREFIX.length).match(
    /^([A-Za-z0-9_-]{16,64})(?:&k=([A-Za-z0-9-]{6,7}))?$/,
  );
  if (!m) return null;
  return { id: m[1], code: m[2] ? m[2].replace('-', '').toUpperCase() : '' };
}

function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * The sheet body, lifted by `lift` (keyboard height) and by the user's own drag, which
 * closes the sheet when released far enough down. Both offsets are transforms, so the
 * dimmed backdrop keeps covering the screen while the sheet slides over it.
 */
function DraggableSheet({
  lift, onClose, style, children,
}: {
  lift: Animated.Value;
  onClose: () => void;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  // Created once per sheet mount; state rather than a ref because React Compiler rejects
  // reading `.current` during render, and the sheet unmounts on close so it always starts at 0.
  const [drag] = useState(() => new Animated.Value(0));

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_e, g) =>
      g.dy > DRAG_GRADIENT && Math.abs(g.dy) > Math.abs(g.dx) * 2,
    onPanResponderMove: (_e, g) => drag.setValue(Math.max(0, g.dy)),
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_e, g) => {
      if (g.dy > DRAG_CLOSE_DISTANCE || g.vy > DRAG_CLOSE_VELOCITY) {
        Animated.timing(drag, {
          toValue: 600, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: false,
        }).start(onClose);
      } else {
        Animated.spring(drag, { toValue: 0, speed: 14, bounciness: 4, useNativeDriver: false }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(drag, { toValue: 0, speed: 14, bounciness: 4, useNativeDriver: false }).start();
    },
  }), [drag, onClose]);

  return (
    <Animated.View {...responder.panHandlers} style={[style, { transform: [{ translateY: lift }, { translateY: drag }] }]}>
      {children}
    </Animated.View>
  );
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
  const [pending, setPending] = useState<PendingChallenge | null>(null);
  const [requestInfo, setRequestInfo] = useState<ChallengeRequestInfo | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [signedInBrowser, setSignedInBrowser] = useState('That computer');

  const [lift] = useState(() => new Animated.Value(0));

  // The camera must mount exactly once per visit: code and confirm used to be separate
  // return branches with their own CameraView, so every sheet open/close tore the camera
  // down and remounted it, which on Android often leaves the new surface permanently black.
  // The sheets are dimmed overlays inside one persistent layout, and the success screen is
  // a full-bleed overlay rather than a separate screen.

  // SDK 57 forces edge-to-edge, so Android no longer resizes the window for the keyboard and
  // KeyboardAvoidingView shifts nothing. The keyboard event carries the real height, so the
  // sheet is moved by exactly that much — up over the keys, down again when they close.
  useEffect(() => {
    const move = (toValue: number) =>
      Animated.timing(lift, { toValue, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => move(-(e.endCoordinates?.height ?? 0)),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => move(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [lift]);

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

  const closeSheet = useCallback(() => {
    setMode('camera');
    setPending(null);
    setRequestInfo(null);
    setCode('');
    setBusy(false);
    Keyboard.dismiss();
  }, []);

  // Stable identity: the drag responder is rebuilt if this changes, and a mid-drag rebuild
  // would drop the gesture.
  const dismissCodeSheet = useCallback(() => setMode('camera'), []);

  // The screen keeps its state when you leave a tab stack, so every exit path resets it:
  // without this, "Done" then reopening the screen showed the old success page instead of
  // the camera.
  const leaveScreen = () => {
    closeSheet();
    router.back();
  };

  // One deadline, computed once. The countdown text and the expiry that closes the sheet read
  // the same value, so they cannot drift into a sheet that says "0:00" forever.
  const expiresAt = requestInfo ? new Date(requestInfo.createdAt).getTime() + CHALLENGE_TTL_MS : 0;
  const remainingMs = expiresAt - now;

  useEffect(() => {
    if (mode !== 'confirm' || !requestInfo) return;
    const t = setInterval(() => {
      const nowMs = Date.now();
      setNow(nowMs);
      if (nowMs >= expiresAt) {
        clearInterval(t);
        closeSheet();
        Alert.alert('Code expired', 'Show a new code on the computer and scan it again.');
      }
    }, 1000);
    return () => clearInterval(t);
  }, [mode, requestInfo, expiresAt, closeSheet]);

  const onScanned = (result: BarcodeScanningResult) => {
    const parsed = parseChallengePayload(result.data);
    if (!parsed) {
      Alert.alert('Not a sign-in code', 'This QR code is not for signing in on web.');
      return;
    }
    void (async () => {
      setBusy(true);
      try {
        setRequestInfo(await getChallengeRequest(parsed.id));
        setPending(parsed);
        setNow(Date.now());
        setMode('confirm');
      } catch {
        Alert.alert('Code expired', 'Show a new code on the computer and scan it again.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const approve = async (run: () => Promise<ChallengeApproval>, label: string) => {
    setBusy(true);
    try {
      await run();
      setSignedInBrowser(label);
      setMode('success');
      setCode('');
      Keyboard.dismiss();
    } catch (err) {
      Alert.alert('Could not sign in', approvalErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Typing the code used to sign the machine in sight unseen. It now resolves the same
  // pending record the QR carries, so scan and typed entry land on one confirm sheet.
  const submitCodeOnly = async () => {
    const typed = code.trim().toUpperCase().replace(/-/g, '');
    if (!CODE_PATTERN.test(typed)) {
      Alert.alert('Wrong format', 'The code is 6 characters, like 2JR-YMP.');
      return;
    }
    setBusy(true);
    try {
      const found = await getChallengeRequestByCode(typed);
      setRequestInfo(found.request);
      setPending({ id: found.challengeId, code: typed });
      setNow(Date.now());
      Keyboard.dismiss();
      setMode('confirm');
    } catch (err) {
      Alert.alert('Could not check that code', approvalErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const approvePending = () => {
    if (!pending) return;
    if (!CODE_PATTERN.test(pending.code)) {
      Alert.alert('Old QR code', 'This QR carries no key. Tap "Enter the code instead" and type the six characters.');
      return;
    }
    void approve(() => approveChallengeById(pending.id, pending.code), browserLabel);
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={leaveScreen} style={styles.backBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>Sign in on web</ThemedText>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderCameraArea = () => (
    <View style={styles.cameraContainer}>
      {!permission ? (
        <View style={[styles.cameraPlaceholder, { backgroundColor: colors.backgroundElement }]}>
          <ActivityIndicator size="large" color={colors.textSecondary} />
          <ThemedText style={[styles.cameraPlaceholderText, { color: colors.textSecondary }]}>Requesting camera…</ThemedText>
        </View>
      ) : !permission.granted ? (
        <View style={[styles.cameraPlaceholder, { backgroundColor: colors.backgroundElement }]}>
          <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.cameraPlaceholderText, { color: colors.textSecondary }]}>
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
            onBarcodeScanned={!busy && mode === 'camera' ? onScanned : undefined}
          />
          {mode === 'camera' && (
            <>
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
        </>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={[styles.cameraFooter, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
      <ThemedText style={[styles.cameraCaption, { color: colors.textSecondary }]}>
        Open app.inkwelly.com on your computer and point the camera at the code it shows.
      </ThemedText>
      <TouchableOpacity onPress={() => setMode('code')} style={styles.codeLink}>
        <ThemedText style={[styles.link, { color: TEAL }]}>
          <Ionicons name="keypad-outline" size={16} color={TEAL} />  Enter the code instead
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderCodeSheet = () => (
    <View style={styles.scrim}>
      <DraggableSheet lift={lift} onClose={dismissCodeSheet} style={[styles.codeSheet, { backgroundColor: colors.background }]}>
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
          onPress={() => void submitCodeOnly()}
          disabled={busy}
        >
          <ThemedText style={styles.primaryText}>{busy ? 'Checking…' : 'Continue'}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={dismissCodeSheet} style={styles.spacer}>
          <ThemedText style={[styles.link, { color: TEAL }]}>Scan the code instead</ThemedText>
        </TouchableOpacity>
      </DraggableSheet>
    </View>
  );

  const renderConfirmSheet = () => (
    <View style={styles.scrim}>
      <DraggableSheet lift={lift} onClose={closeSheet} style={[styles.sheet, { backgroundColor: colors.background }]}>
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
            onPress={approvePending}
            disabled={busy}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <ThemedText style={styles.primaryText}>{busy ? 'Signing in…' : 'Yes, sign in'}</ThemedText>
          </TouchableOpacity>
        </View>
      </DraggableSheet>
    </View>
  );

  const renderSuccessOverlay = () => (
    <View style={[styles.successFull, { backgroundColor: colors.background }]}>
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
        <TouchableOpacity style={[styles.primary, styles.spacer]} onPress={leaveScreen}>
          <ThemedText style={styles.primaryText}>Done</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={closeSheet} style={styles.spacer}>
          <ThemedText style={[styles.link, { color: TEAL }]}>
            <Ionicons name="scan-outline" size={15} color={TEAL} />  Scan another code
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.screen} safeAreaTop>
      {renderHeader()}
      {renderCameraArea()}
      {renderFooter()}
      {mode === 'code' && renderCodeSheet()}
      {mode === 'confirm' && renderConfirmSheet()}
      {/* Absolute overlay, not a branch: unmounting this row would unmount the camera with
          it, and the remount on "Scan another code" is exactly the black preview bug. */}
      {mode === 'success' && renderSuccessOverlay()}
    </ThemedView>
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

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  cameraContainer: { flex: 1, minHeight: 240, marginHorizontal: 16, marginTop: 8, borderRadius: 28, overflow: 'hidden', position: 'relative' },
  scanFrameOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 230, height: 230, borderRadius: 26, borderWidth: 5, borderColor: 'rgba(255,255,255,0.95)' },
  busyTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  cameraPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  cameraPlaceholderText: { fontSize: 14 },
  allowCameraBtn: { backgroundColor: TEAL, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  allowCameraText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cameraFooter: { paddingHorizontal: 24, paddingTop: 16, gap: 12, alignItems: 'center' },
  cameraCaption: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
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
  codeInput: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 22, letterSpacing: 6, fontFamily: 'monospace' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  notMe: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: 'transparent' },
  notMeText: { fontWeight: '700', fontSize: 15 },
  yesSignIn: { flex: 1.4, backgroundColor: TEAL, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  primary: { backgroundColor: TEAL, borderRadius: 14, paddingVertical: 14, alignItems: 'center', alignSelf: 'stretch' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { fontSize: 14, textAlign: 'center' },
  successFull: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  successCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
