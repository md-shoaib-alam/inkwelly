import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, Palette } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { api } from '@/lib/api';

type Mode = 'camera' | 'code';
type ResultKind = 'success' | 'already' | 'error';

interface ScanResult {
  kind: ResultKind;
  title: string;
  message: string;
  time?: string;
  userName?: string;
  action?: string;
}

export interface TeacherQRScanModalProps {
  visible: boolean;
  onClose: () => void;
  todayMarked?: boolean;
  todayCheckIn?: string | null;
  onScanned?: (time?: string) => void;
}

export function TeacherQRScanModal({
  visible,
  onClose,
  todayMarked = false,
  todayCheckIn = null,
  onScanned,
}: TeacherQRScanModalProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  // Responsive framed camera dimensions:
  // Framed with margins from left, right, top, bottom with rounded corners (reduced from every side)
  const cameraWidth = Math.min(screenWidth - 32, 400);
  const maxAllowedHeight =
    screenHeight -
    (Math.max(insets.top, 14) + 140) -
    (Math.max(insets.bottom, 16) + 70);
  const cameraHeight = Math.max(260, Math.min(maxAllowedHeight, cameraWidth * 1.15, 420));

  const reticleSize = Math.round(Math.min(cameraWidth - 40, cameraHeight - 40, 260));
  const innerSize = Math.round(reticleSize * 0.74);

  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('camera');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [localTodayMarked, setLocalTodayMarked] = useState(todayMarked);
  const [localTodayCheckIn, setLocalTodayCheckIn] = useState<string | null>(todayCheckIn);

  const submitLockRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResumeTimer = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  useEffect(() => clearResumeTimer, []);

  useEffect(() => {
    if (visible) {
      setLocalTodayMarked(todayMarked);
      setLocalTodayCheckIn(todayCheckIn);
    } else {
      clearResumeTimer();
      setResult(null);
      setCode('');
      setMode('camera');
      submitLockRef.current = false;
    }
  }, [visible, todayMarked, todayCheckIn]);

  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission?.granted]);

  const submit = useCallback(
    async (payload: { qrData?: string; code?: string }, source: Mode) => {
      if (submitLockRef.current) return;
      submitLockRef.current = true;
      clearResumeTimer();
      setSubmitting(true);
      setResult(null);

      try {
        const res = await api.post('/staff-attendance/qr/scan', payload);
        Vibration.vibrate([40, 60, 40]);
        const name = res?.userName ? String(res.userName) : '';
        const actionText = res?.action === 'check_out' ? 'Checked Out' : 'Checked In';

        setResult({
          kind: 'success',
          title: `${actionText} Confirmed!`,
          message: `Recorded for ${name || 'Staff Member'}`,
          time: res?.time,
          userName: name,
          action: actionText,
        });

        setLocalTodayMarked(true);
        setLocalTodayCheckIn(res?.time ?? null);
        setCode('');
        onScanned?.(res?.time);
      } catch (err: any) {
        const message = err?.message || 'Could not reach the server. Please try again.';

        if (/already marked/i.test(message) || /already checked in/i.test(message)) {
          setResult({
            kind: 'already',
            title: 'Already Marked',
            message: 'Your attendance is already marked for today.',
          });
          setLocalTodayMarked(true);
        } else {
          setResult({
            kind: 'error',
            title: 'Not Verified',
            message: /invalid/i.test(message)
              ? 'This QR code has expired or was already used. Wait for the kiosk to show the next code and try again.'
              : message,
          });

          if (source === 'camera') {
            resumeTimerRef.current = setTimeout(() => {
              resumeTimerRef.current = null;
              setResult(null);
            }, 2500);
          }
        }
      } finally {
        submitLockRef.current = false;
        setSubmitting(false);
      }
    },
    [onScanned]
  );

  const handleBarcodeScanned = useCallback(
    (scan: BarcodeScanningResult) => {
      if (submitLockRef.current || !scan?.data) return;
      submit({ qrData: scan.data }, 'camera');
    },
    [submit]
  );

  if (!visible) return null;

  const cameraReady = Boolean(permission?.granted);
  const cameraActive = mode === 'camera' && cameraReady && !submitting && !result;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* ── Top Gradient Header (Matching Image 2) ── */}
        <LinearGradient
          colors={['#2563EB', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.7 }}
          style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}
        >
          <View style={styles.headerRow}>
            {/* Left: QR Icon Box & Title */}
            <View style={styles.headerLeftGroup}>
              <View style={styles.headerIconBox}>
                <Ionicons name="qr-code" size={19} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.headerTitle}>Scan Attendance QR</ThemedText>
            </View>

            {/* Right: Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          {!(result && result.kind === 'success') && (
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabItem, mode === 'camera' && styles.tabItemActive]}
                activeOpacity={0.85}
                onPress={() => {
                  clearResumeTimer();
                  setResult(null);
                  setMode('camera');
                }}
              >
                <Ionicons
                  name="camera"
                  size={15}
                  color={mode === 'camera' ? '#1D4ED8' : 'rgba(255,255,255,0.85)'}
                />
                <ThemedText
                  style={[
                    styles.tabLabel,
                    { color: mode === 'camera' ? '#1D4ED8' : 'rgba(255,255,255,0.85)' },
                  ]}
                >
                  Camera Scanner
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, mode === 'code' && styles.tabItemActive]}
                activeOpacity={0.85}
                onPress={() => {
                  clearResumeTimer();
                  setResult(null);
                  setMode('code');
                }}
              >
                <Ionicons
                  name="key"
                  size={15}
                  color={mode === 'code' ? '#1D4ED8' : 'rgba(255,255,255,0.85)'}
                />
                <ThemedText
                  style={[
                    styles.tabLabel,
                    { color: mode === 'code' ? '#1D4ED8' : 'rgba(255,255,255,0.85)' },
                  ]}
                >
                  6-Digit Code
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* ── Main Full-Screen Body ── */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {result && result.kind === 'success' ? (
            /* ── Success Confirmation Screen ── */
            <View style={[styles.successContainer, { backgroundColor: isDark ? '#090D16' : '#FFFFFF' }]}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={54} color="#059669" />
              </View>

              <ThemedText style={[styles.successTitle, { color: colors.text }]}>
                {result.title}
              </ThemedText>
              <ThemedText style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                {result.message}
              </ThemedText>

              {result.time && (
                <View style={styles.timeBadge}>
                  <Ionicons name="time" size={16} color="#059669" />
                  <ThemedText style={styles.timeBadgeText}>
                    Time: {result.time} (IST)
                  </ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={styles.doneButton}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.doneButtonText}>Done</ThemedText>
              </TouchableOpacity>
            </View>
          ) : mode === 'camera' ? (
            /* ── Framed Camera Scanner (Reduced from every side with rounded corners) ── */
            <View
              style={[
                styles.cameraWrapper,
                { backgroundColor: isDark ? '#090D16' : '#0B1120' },
              ]}
            >
              <View
                style={[
                  styles.cameraFrame,
                  {
                    width: cameraWidth,
                    height: cameraHeight,
                  },
                ]}
              >
                {cameraReady ? (
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={cameraActive ? handleBarcodeScanned : undefined}
                    onMountError={() => {
                      setMode('code');
                      setResult({
                        kind: 'error',
                        title: 'Camera Unavailable',
                        message:
                          'The camera could not start on this device. Enter the 6-digit code shown on the kiosk screen instead.',
                      });
                    }}
                  />
                ) : (
                  <View style={[styles.permissionContainer, { backgroundColor: isDark ? '#0F172A' : '#1E293B' }]}>
                    <Ionicons name="camera-outline" size={48} color="#3B82F6" />
                    <ThemedText style={[styles.permissionTitle, { color: '#FFFFFF' }]}>
                      Camera Access Needed
                    </ThemedText>
                    <ThemedText style={[styles.permissionText, { color: '#94A3B8' }]}>
                      Point your camera at the school kiosk QR code to instantly verify and log your attendance.
                    </ThemedText>
                    {permission?.canAskAgain ? (
                      <TouchableOpacity
                        style={styles.permissionBtn}
                        onPress={requestPermission}
                        activeOpacity={0.85}
                      >
                        <ThemedText style={styles.permissionBtnText}>Enable Camera</ThemedText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.permissionBtn, { backgroundColor: '#475569' }]}
                        onPress={() => setMode('code')}
                        activeOpacity={0.85}
                      >
                        <ThemedText style={styles.permissionBtnText}>Use 6-Digit Code Instead</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* ── Reticle Overlays: Outer White Brackets + Inner Blue Dashed Square ── */}
                {cameraReady && (
                  <View pointerEvents="none" style={styles.reticleOverlay}>
                    {/* Outer White Reticle (Thick White Corner Brackets) */}
                    <View style={[styles.outerWhiteReticle, { width: reticleSize, height: reticleSize }]}>
                      <View style={[styles.whiteCorner, styles.whiteCornerTL]} />
                      <View style={[styles.whiteCorner, styles.whiteCornerTR]} />
                      <View style={[styles.whiteCorner, styles.whiteCornerBL]} />
                      <View style={[styles.whiteCorner, styles.whiteCornerBR]} />

                      {/* Inner Blue Reticle (Dashed Border + Blue Solid Accents) */}
                      <View style={[styles.innerBlueReticle, { width: innerSize, height: innerSize }]}>
                        <View style={[styles.blueCorner, styles.blueCornerTL]} />
                        <View style={[styles.blueCorner, styles.blueCornerTR]} />
                        <View style={[styles.blueCorner, styles.blueCornerBL]} />
                        <View style={[styles.blueCorner, styles.blueCornerBR]} />
                      </View>
                    </View>
                  </View>
                )}

                {/* Error or Alert Banner on Camera */}
                {result && result.kind !== 'success' && (
                  <View
                    style={[
                      styles.cameraErrorBanner,
                      result.kind === 'already'
                        ? { backgroundColor: 'rgba(245,158,11,0.92)' }
                        : { backgroundColor: 'rgba(225,29,72,0.92)' },
                    ]}
                  >
                    <Ionicons
                      name={result.kind === 'already' ? 'alert-circle' : 'close-circle'}
                      size={20}
                      color="#FFFFFF"
                    />
                    <ThemedText style={styles.cameraErrorText}>
                      {result.message}
                    </ThemedText>
                  </View>
                )}

                {/* Loading / Submitting Overlay */}
                {submitting && (
                  <View style={styles.submittingOverlay}>
                    <ActivityIndicator size="large" color="#34D399" />
                    <ThemedText style={styles.submittingText}>
                      Verifying QR Token...
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Bottom Instruction Bar (Sitting cleanly below the framed camera card) */}
              <View
                style={[
                  styles.bottomInstructionCard,
                  { paddingBottom: Math.max(insets.bottom, 16) + 12 },
                ]}
              >
                <ThemedText style={styles.bottomInstructionText}>
                  Hold phone steady over the QR code on the admin screen
                </ThemedText>
              </View>
            </View>
          ) : (
            /* ── 6-Digit Manual Code Tab ── */
            <ScrollView
              contentContainerStyle={[
                styles.codeContainer,
                {
                  backgroundColor: isDark ? '#090D16' : '#FFFFFF',
                  paddingBottom: Math.max(insets.bottom, 20) + 20,
                },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.codeIconBox}>
                <Ionicons name="key" size={32} color="#2563EB" />
              </View>

              <ThemedText style={[styles.codeTitle, { color: colors.text }]}>
                Enter the 6-Digit Code
              </ThemedText>
              <ThemedText style={[styles.codeSubtitle, { color: colors.textSecondary }]}>
                Enter the 6-digit code shown beneath the QR code on the school kiosk screen.
              </ThemedText>

              <TextInput
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="• • • • • •"
                placeholderTextColor={colors.textSecondary}
                editable={!submitting}
                autoFocus
                style={[
                  styles.codeInput,
                  {
                    color: colors.text,
                    borderColor: code.length === 6 ? '#2563EB' : colors.border,
                    backgroundColor: isDark ? '#18181B' : '#F8FAFC',
                  },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.submitCodeBtn,
                  (code.length !== 6 || submitting) && styles.submitCodeBtnDisabled,
                ]}
                disabled={code.length !== 6 || submitting}
                activeOpacity={0.85}
                onPress={() => submit({ code }, 'code')}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.submitCodeRow}>
                    <Ionicons name="flash" size={17} color="#FFFFFF" />
                    <ThemedText style={styles.submitCodeText}>
                      Punch In with Code
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>

              {result && result.kind !== 'success' && (
                <View
                  style={[
                    styles.codeResultCard,
                    result.kind === 'already'
                      ? { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: '#F59E0B' }
                      : { backgroundColor: 'rgba(225,29,72,0.12)', borderColor: '#E11D48' },
                  ]}
                >
                  <Ionicons
                    name={result.kind === 'already' ? 'alert-circle' : 'close-circle'}
                    size={20}
                    color={result.kind === 'already' ? '#F59E0B' : '#E11D48'}
                  />
                  <ThemedText
                    style={[
                      styles.codeResultText,
                      { color: result.kind === 'already' ? '#B45309' : '#E11D48' },
                    ]}
                  >
                    {result.message}
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// RN's StyleSheet.absoluteFillObject is not in this version's types
const ABSOLUTE_FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginTop: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Camera Framed Viewfinder Styles */
  cameraWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  cameraFrame: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  permissionContainer: {
    ...ABSOLUTE_FILL,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  permissionText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionBtn: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Reticle Overlay matching Image 2 */
  reticleOverlay: {
    ...ABSOLUTE_FILL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerWhiteReticle: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  whiteCorner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#FFFFFF',
  },
  whiteCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4.5,
    borderLeftWidth: 4.5,
    borderTopLeftRadius: 14,
  },
  whiteCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4.5,
    borderRightWidth: 4.5,
    borderTopRightRadius: 14,
  },
  whiteCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4.5,
    borderLeftWidth: 4.5,
    borderBottomLeftRadius: 14,
  },
  whiteCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4.5,
    borderRightWidth: 4.5,
    borderBottomRightRadius: 14,
  },
  innerBlueReticle: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(59,130,246,0.9)',
    position: 'relative',
  },
  blueCorner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#3B82F6',
  },
  blueCornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 9,
  },
  blueCornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 9,
  },
  blueCornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 9,
  },
  blueCornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 9,
  },

  /* Bottom Caption */
  bottomInstructionCard: {
    paddingHorizontal: 20,
    paddingTop: 14,
    alignItems: 'center',
  },
  bottomInstructionText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Submitting / Error Overlays */
  submittingOverlay: {
    ...ABSOLUTE_FILL,
    backgroundColor: 'rgba(2,6,23,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submittingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cameraErrorBanner: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cameraErrorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  /* 6-Digit Code View */
  codeContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 36,
    gap: 12,
  },
  codeIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  codeSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  codeInput: {
    width: '100%',
    maxWidth: 280,
    height: 60,
    borderWidth: 2,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 10,
    marginTop: 12,
  },
  submitCodeBtn: {
    width: '100%',
    maxWidth: 280,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitCodeBtnDisabled: {
    opacity: 0.45,
  },
  submitCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitCodeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  codeResultCard: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  codeResultText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  /* Success View */
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 8,
  },
  timeBadgeText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
  doneButton: {
    width: '100%',
    maxWidth: 260,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
