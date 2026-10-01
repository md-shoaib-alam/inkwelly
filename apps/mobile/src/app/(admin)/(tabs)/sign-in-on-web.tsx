import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
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
const CODE_PATTERN = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{2}-?[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}$/i;

type Mode = 'camera' | 'code' | 'confirm';

/** A school attendance QR must say "not a sign-in code", not post something. */
function parseChallengeId(data: string): string | null {
  if (!data.startsWith(CHALLENGE_PREFIX)) return null;
  const id = data.slice(CHALLENGE_PREFIX.length).trim();
  return /^[A-Za-z0-9_-]{16,64}$/.test(id) ? id : null;
}

export default function SignInOnWebScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('camera');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<ChallengeRequestInfo | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const confirmChallenge = async (id: string) => {
    setBusy(true);
    try {
      setRequestInfo(await getChallengeRequest(id));
      setChallengeId(id);
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

  // Both paths hit the same endpoint with the same code requirement, so no role can be
  // reachable by one path and not the other.
  const approve = async (run: () => Promise<ChallengeApproval>) => {
    setBusy(true);
    try {
      const res = await run();
      Alert.alert('Signed in', `${res.user.name} is signed in on that computer.`);
      router.back();
    } catch (err) {
      Alert.alert('Could not sign in', approvalErrorMessage(err));
      setBusy(false);
    }
  };

  const submitCodeOnly = () => {
    if (!CODE_PATTERN.test(code.trim())) {
      Alert.alert('Wrong format', 'The code is 5 characters, like 2JR-YMP.');
      return;
    }
    void approve(() => approveChallengeByCode(code.trim()));
  };

  const approveScanned = () => {
    if (!challengeId) return;
    if (!CODE_PATTERN.test(code.trim())) {
      Alert.alert('Type the code', 'Enter the 5 characters shown beside the QR code.');
      return;
    }
    void approve(() => approveChallengeById(challengeId, code.trim()));
  };

  if (!permission) {
    return <ThemedView style={styles.center}><ActivityIndicator /></ThemedView>;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.body}>Camera access lets you scan the code instead of typing it.</ThemedText>
        <TouchableOpacity style={styles.primary} onPress={() => void requestPermission()}>
          <ThemedText style={styles.primaryText}>Allow camera</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('code')}>
          <ThemedText style={styles.link}>Type the code instead</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (mode === 'confirm') {
    const ageSec = requestInfo
      ? Math.max(0, Math.round((Date.now() - new Date(requestInfo.createdAt).getTime()) / 1000))
      : 0;
    return (
      <ThemedView style={styles.screen} safeAreaTop>
        <ScrollView contentContainerStyle={styles.padding}>
          <ThemedText type="title">Sign this computer in?</ThemedText>
          <ThemedText style={[styles.body, styles.gap]}>
            {requestInfo
              ? `${requestInfo.browser} · ${requestInfo.device} · ${requestInfo.ip ?? 'unknown address'} · ${ageSec} seconds ago`
              : 'This computer.'}
          </ThemedText>
          <ThemedText style={[styles.muted, styles.gap]}>
            Only approve a machine in front of you. Typing the code proves you can see this
            computer's screen, so a code relayed over a call is not enough.
          </ThemedText>

          <ThemedText type="defaultSemiBold" style={[styles.label, styles.gap]}>Code on the screen</ThemedText>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="2JR-YMP"
            autoCapitalize="characters"
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />

          <TouchableOpacity style={[styles.primary, styles.gap]} onPress={approveScanned} disabled={busy}>
            <ThemedText style={styles.primaryText}>{busy ? 'Approving…' : 'Approve'}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gap} onPress={() => { setMode('camera'); setCode(''); }}>
            <ThemedText style={styles.link}>Cancel</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  if (mode === 'code') {
    return (
      <ThemedView style={styles.screen} safeAreaTop>
        <ScrollView contentContainerStyle={styles.padding}>
          <ThemedText type="title">Type the code</ThemedText>
          <ThemedText style={[styles.body, styles.gap]}>The 5 characters beside the QR code on the computer.</ThemedText>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="2JR-YMP"
            autoCapitalize="characters"
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
          <TouchableOpacity style={[styles.primary, styles.gap]} onPress={submitCodeOnly} disabled={busy}>
            <ThemedText style={styles.primaryText}>{busy ? 'Approving…' : 'Approve'}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gap} onPress={() => setMode('camera')}>
            <ThemedText style={styles.link}>Scan instead</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen} safeAreaTop>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={busy ? undefined : onScanned}
      />
      <View style={styles.footer}>
        <ThemedText type="defaultSemiBold">Point at the QR code on the computer</ThemedText>
        {busy && <ActivityIndicator />}
        <TouchableOpacity onPress={() => setMode('code')}>
          <ThemedText style={styles.link}>Camera not focusing? Type the code</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  padding: { padding: 20, gap: 8 },
  camera: { flex: 1 },
  footer: { padding: 20, gap: 10 },
  body: { fontSize: 14, opacity: 0.8 },
  muted: { fontSize: 12, opacity: 0.65 },
  label: { fontSize: 13 },
  gap: { marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, letterSpacing: 3 },
  primary: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: '#007AFF', fontSize: 14, textAlign: 'center' },
});
