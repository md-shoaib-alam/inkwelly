import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Linking, 
  useWindowDimensions,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { api } from '@/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';

// Custom illustration SVG for Lock
interface IllustrationProps {
  isTablet: boolean;
  isDark: boolean;
}

function LockIllustration({ isTablet, isDark }: IllustrationProps) {
  return (
    <View style={[styles.illustrationContainer, { marginTop: isTablet ? 20 : 4, marginBottom: isTablet ? 32 : 16 }]}>
      <Svg width={isTablet ? 180 : 140} height={isTablet ? 180 : 140} viewBox="0 0 200 200" fill="none">
        {/* Shackle */}
        <Path
          d="M60 90V60C60 37.9086 77.9086 20 100 20C122.091 20 140 37.9086 140 60V90"
          stroke={isDark ? '#E5E7EB' : '#4A5568'}
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Lock Body */}
        <Rect
          x={40}
          y={80}
          width={120}
          height={100}
          rx={28}
          fill="#4D8BFF"
        />
        {/* Lock Shadow Accent */}
        <Path
          d="M132 80H120C120 80 125 100 125 130C125 160 120 180 120 180H132C147.464 180 160 167.464 160 152V108C160 92.536 147.464 80 132 80Z"
          fill="#56E6FF"
        />
        {/* Keyhole */}
        <Circle cx={100} cy={120} r={14} fill={isDark ? '#0A1E40' : '#EBF3FF'} />
        <Rect x={94} y={126} width={12} height={24} rx={6} fill={isDark ? '#0A1E40' : '#EBF3FF'} />
      </Svg>
    </View>
  );
}

// Custom illustration SVG for Mailbox
function MailboxIllustration({ isTablet, isDark }: IllustrationProps) {
  return (
    <View style={[styles.illustrationContainer, { marginTop: isTablet ? 20 : 4, marginBottom: isTablet ? 32 : 16 }]}>
      <Svg width={isTablet ? 220 : 170} height={isTablet ? 180 : 140} viewBox="0 0 240 200" fill="none">
        {/* Stand/Post */}
        <Rect x={112} y={140} width={16} height={40} fill={isDark ? '#E5E7EB' : '#4A5568'} rx={4} />
        
        {/* Mailbox Base Plate */}
        <Rect x={48} y={130} width={132} height={10} fill="#4D8BFF" rx={5} />
        
        {/* Mailbox Body */}
        <Path
          d="M78 50H160C171.046 50 180 58.9543 180 70V130H78V50Z"
          fill="#56E6FF"
        />
        <Path
          d="M78 50C54.804 50 36 68.804 36 92C36 115.196 54.804 134 78 134V50Z"
          fill="#4D8BFF"
        />
        
        {/* Mailbox Door/Opening shadow */}
        <Circle cx={78} cy={92} r={12} fill={isDark ? '#0A1E40' : '#EBF3FF'} />
        
        {/* Flag Pole and Flag */}
        <Rect x={132} y={20} width={6} height={60} fill={isDark ? '#E5E7EB' : '#4A5568'} rx={3} />
        <Circle cx={135} cy={80} r={8} fill="#4D8BFF" />
        <Path d="M138 20H168L160 35L168 50H138V20Z" fill="#56E6FF" />
        
        {/* Letter/Envelope sticking out */}
        <Rect x={62} y={80} width={60} height={40} rx={6} fill="#FFFFFF" />
        <Path
          d="M62 82L92 102L122 82"
          stroke="#4D8BFF"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={72} cy={110} r={4} fill="#56E6FF" />
        <Rect x={82} y={108} width={16} height={4} rx={2} fill="#56E6FF" />
      </Svg>
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const gradientColors = isDark 
    ? ['#102E6E', '#060B1E', '#02040A'] as const
    : ['#F4F7FC', '#E2ECF8'] as const;

  const buttonColors = isDark
    ? ['#4F7DF9', '#82F3FF', '#12D0F6'] as const
    : ['#007AFF', '#0051D5'] as const;

  const buttonTextColor = isDark ? '#0A1E40' : '#FFFFFF';

  const textColor = isDark ? '#FFFFFF' : '#0B1E40';
  const subtitleColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(11, 30, 64, 0.6)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 30, 64, 0.04)';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(11, 30, 64, 0.12)';
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(11, 30, 64, 0.4)';
  const iconColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(11, 30, 64, 0.5)';

  const isTablet = width > 600;
  const responsiveMaxWidth = isTablet ? 500 : 440;

  const [step, setStep] = useState<'select' | 'input' | 'success'>('select');
  const [resetMode, setResetMode] = useState<'email' | 'phone'>('email');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleResetPassword = async () => {
    const trimmedVal = inputValue.trim();
    if (!trimmedVal) {
      setErrorMessage(resetMode === 'email' ? 'Please enter your email address.' : 'Please enter your mobile number.');
      return;
    }

    if (resetMode === 'email') {
      const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedVal);
      if (!isEmailFormat) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
    } else {
      const isPhoneFormat = /^[0-9]{10}$/.test(trimmedVal);
      if (!isPhoneFormat) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const payload = resetMode === 'email' ? { email: trimmedVal } : { phone: trimmedVal };
      await api.post('/auth/reset-password', payload);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(
        err.message || 
        (resetMode === 'email' 
          ? 'The email address you entered is not registered in our system.' 
          : 'The mobile number you entered is not registered in our system.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:hello@radiyal.com').catch(() => {});
  };

  const handleOpenAction = () => {
    if (resetMode === 'email') {
      if (Platform.OS === 'web') {
        Linking.openURL('https://mail.google.com').catch(() => {});
      } else if (Platform.OS === 'ios') {
        Linking.openURL('message://').catch(() => {
          Linking.openURL('googlegmail://inbox').catch(() => {
            Linking.openURL('googlegmail:///').catch(() => {
              Linking.openURL('ms-outlook://').catch(() => {
                Linking.openURL('https://mail.google.com').catch(() => {});
              });
            });
          });
        });
      } else if (Platform.OS === 'android') {
        Linking.openURL('googlegmail://inbox').catch(() => {
          Linking.openURL('googlegmail:///').catch(() => {
            Linking.openURL('ms-outlook://').catch(() => {
              Linking.openURL('https://mail.google.com').catch(() => {});
            });
          });
        });
      }
    } else {
      Linking.openURL('sms:').catch(() => {});
    }
  };

  const handleBack = () => {
    if (step === 'success') {
      setStep('input');
    } else if (step === 'input') {
      setStep('select');
      setInputValue('');
      setErrorMessage('');
    } else {
      router.back();
    }
  };

  return (
    <LinearGradient 
      colors={gradientColors} 
      style={styles.container}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color={textColor} />
        </TouchableOpacity>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.cardContainer, { maxWidth: responsiveMaxWidth }]}>
            
            {/* ── STEP 1: CHOOSE RESET METHOD ──────────────────────────── */}
            {step === 'select' && (
              <>
                <View style={styles.headerTextContainer}>
                  <ThemedText style={[styles.hiText, { color: textColor }]}>Reset Password</ThemedText>
                  <ThemedText style={[styles.subtitleText, { color: subtitleColor }]}>
                    Choose option to reset your password
                  </ThemedText>
                </View>

                <View style={styles.gridContainer}>
                  {/* Phone Option */}
                  <TouchableOpacity 
                    style={[
                      styles.gridCard, 
                      { 
                        borderColor: resetMode === 'phone' ? (isDark ? '#56E6FF' : '#007AFF') : inputBorder, 
                        backgroundColor: resetMode === 'phone' ? (isDark ? 'rgba(86, 230, 255, 0.08)' : 'rgba(0, 122, 255, 0.05)') : inputBg
                      }
                    ]}
                    onPress={() => {
                      setResetMode('phone');
                      setStep('input');
                    }}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: resetMode === 'phone' ? (isDark ? '#4D8BFF' : '#007AFF') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,30,64,0.1)') }]}>
                      <Ionicons name="phone-portrait" size={26} color={isDark ? '#FFFFFF' : (resetMode === 'phone' ? '#FFFFFF' : '#0B1E40')} />
                    </View>
                    <ThemedText style={[styles.gridLabel, { color: textColor }]}>Phone Number</ThemedText>
                  </TouchableOpacity>

                  {/* Email Option */}
                  <TouchableOpacity 
                    style={[
                      styles.gridCard, 
                      { 
                        borderColor: resetMode === 'email' ? (isDark ? '#56E6FF' : '#007AFF') : inputBorder, 
                        backgroundColor: resetMode === 'email' ? (isDark ? 'rgba(86, 230, 255, 0.08)' : 'rgba(0, 122, 255, 0.05)') : inputBg
                      }
                    ]}
                    onPress={() => {
                      setResetMode('email');
                      setStep('input');
                    }}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: resetMode === 'email' ? (isDark ? '#4D8BFF' : '#007AFF') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,30,64,0.1)') }]}>
                      <Ionicons name="mail" size={26} color={isDark ? '#FFFFFF' : (resetMode === 'email' ? '#FFFFFF' : '#0B1E40')} />
                    </View>
                    <ThemedText style={[styles.gridLabel, { color: textColor }]}>Email Address</ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── STEP 2: INPUT VALUE ──────────────────────────────────── */}
            {step === 'input' && (
              <>
                <LockIllustration isTablet={isTablet} isDark={isDark} />

                <View style={styles.headerTextContainer}>
                  <ThemedText style={[styles.hiText, { color: textColor }]}>Forgot Password</ThemedText>
                  <ThemedText style={[styles.subtitleText, { color: subtitleColor }]}>
                    Please enter your {resetMode === 'email' ? 'email address' : 'mobile number'} to reset your password.
                  </ThemedText>
                </View>

                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color="#FF453A" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                  </View>
                ) : null}

                <View style={styles.formContainer}>
                  <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                    <Ionicons 
                      name={resetMode === 'email' ? 'mail-outline' : 'phone-portrait-outline'} 
                      size={20} 
                      color={iconColor} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      placeholder={resetMode === 'email' ? 'Enter your email address...' : 'e.g. 9876543210 (10 digits)'}
                      placeholderTextColor={placeholderColor}
                      value={inputValue}
                      onChangeText={setInputValue}
                      autoCapitalize="none"
                      keyboardType={resetMode === 'email' ? 'email-address' : 'number-pad'}
                      maxLength={resetMode === 'email' ? undefined : 10}
                      returnKeyType="done"
                      onSubmitEditing={handleResetPassword}
                      style={[styles.inputField, { color: textColor }]}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={buttonColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButton}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={buttonTextColor} />
                      ) : (
                        <View style={styles.buttonContent}>
                          <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.submitButtonText, { color: buttonTextColor }]}>Send Code</ThemedText>
                          <Ionicons name="arrow-forward" size={20} color={buttonTextColor} style={{ marginLeft: 8 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── STEP 3: SUCCESS STATE ────────────────────────────────── */}
            {step === 'success' && (
              <>
                <MailboxIllustration isTablet={isTablet} isDark={isDark} />

                <View style={styles.headerTextContainer}>
                  <ThemedText style={[styles.hiText, { color: textColor }]}>Password Reset Sent</ThemedText>
                  <ThemedText style={[styles.subtitleText, { color: subtitleColor }]}>
                    {resetMode === 'email'
                      ? "Please check your email in a few minutes - we've sent you an email containing password recovery link."
                      : "Please check your messages in a few minutes - we've sent you an SMS containing password recovery link."}
                  </ThemedText>
                </View>

                <View style={styles.formContainer}>
                  <TouchableOpacity
                    onPress={handleOpenAction}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={buttonColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButton}
                    >
                      <View style={styles.buttonContent}>
                        <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.submitButtonText, { color: buttonTextColor }]}>
                          {resetMode === 'email' ? 'Open My Email' : 'Open Messages'}
                        </ThemedText>
                        <Ionicons 
                          name={resetMode === 'email' ? 'mail-outline' : 'chatbubble-ellipses-outline'} 
                          size={20} 
                          color={buttonTextColor} 
                          style={{ marginLeft: 8 }} 
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backToLoginButton}
                    onPress={() => router.replace('/login')}
                  >
                    <ThemedText style={[styles.backToLoginText, { color: isDark ? '#FFFFFF' : '#007AFF' }]}>
                      Back to Login
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Footer Support Panel */}
            <View style={styles.footerContainer}>
              <ThemedText style={[styles.footerText, { color: subtitleColor }]}>
                {step === 'success' 
                  ? (resetMode === 'email' ? "Didn't receive the email?" : "Didn't receive the SMS?") 
                  : "Don't remember your credentials?"}
              </ThemedText>
              <TouchableOpacity onPress={handleContactUs}>
                <ThemedText style={[styles.contactEmailText, { color: isDark ? '#FFFFFF' : '#007AFF' }]}>
                  Contact us at hello@radiyal.com
                </ThemedText>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    width: '100%',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainScrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  cardContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  hiText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 40,
    paddingBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    paddingBottom: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  gridCard: {
    flex: 1,
    height: 150,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    height: '100%',
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#0A1E40',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactEmailText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  backToLoginButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
