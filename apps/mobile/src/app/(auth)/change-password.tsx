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
  Alert,
  useWindowDimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api, removeRefreshToken } from '@/lib/api';

// Custom illustration SVG for Lock
function LockIllustration({ isTablet, isDark }: { isTablet: boolean; isDark: boolean }) {
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
        <Circle cx={100} cy={120} r={14} fill={isDark ? '#0A1E40' : '#FFFFFF'} />
        <Rect x={94} y={126} width={12} height={24} rx={6} fill={isDark ? '#0A1E40' : '#FFFFFF'} />
      </Svg>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const isTablet = width > 600;
  const responsiveMaxWidth = isTablet ? 500 : 440;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [focusedInput, setFocusedInput] = useState<'old' | 'new' | 'confirm' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const scrollViewRef = React.useRef<ScrollView>(null);

  const scrollToEnd = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleUpdatePassword = async () => {
    setErrorMsg('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      setIsSubmitting(false);
      
      Alert.alert(
        'Success',
        'Password updated successfully. Please login again.',
        [
          {
            text: 'OK',
            onPress: () => {
              removeRefreshToken().catch(() => {});
              router.replace('/');
            },
          },
        ]
      );
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to update password. Please check your current password.');
    }
  };

  const gradientColors = isDark 
    ? ['#0F2042', '#061024'] as const
    : ['#F4F7FC', '#E2ECF8'] as const;

  const buttonColors = isDark
    ? ['#4F7DF9', '#82F3FF', '#12D0F6'] as const
    : ['#007AFF', '#0051D5'] as const;

  const buttonTextColor = isDark ? '#0A1E40' : '#FFFFFF';

  // Dynamic Theme Colors
  const textColor = isDark ? '#FFFFFF' : '#0B1E40';
  const subtitleColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(11, 30, 64, 0.6)';
  const labelColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(11, 30, 64, 0.7)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 30, 64, 0.04)';
  const inputBorderDefault = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(11, 30, 64, 0.12)';
  const inputBorderFocused = isDark ? '#56E6FF' : '#007AFF';
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(11, 30, 64, 0.4)';
  const iconColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(11, 30, 64, 0.5)';

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flexOne}
        >
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.cardContainer, { maxWidth: responsiveMaxWidth }]}>
              
              <LockIllustration isTablet={isTablet} isDark={isDark} />

              <View style={styles.headerTextContainer}>
                <ThemedText style={[styles.hiText, { color: textColor }]}>Change Password</ThemedText>
                <ThemedText style={[styles.subtitleText, { color: subtitleColor }]}>
                  Enter your current password and choose a secure new one.
                </ThemedText>
              </View>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#FF453A" style={{ marginRight: 8 }} />
                  <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
                </View>
              ) : null}

              <View style={styles.formContainer}>
                {/* Current Password */}
                <ThemedText style={[styles.inputLabel, { color: labelColor }]}>Current Password</ThemedText>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: inputBg,
                    borderColor: focusedInput === 'old' ? inputBorderFocused : inputBorderDefault,
                    borderWidth: 1.5
                  }
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={iconColor} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Current Password"
                    placeholderTextColor={placeholderColor}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry={!showOldPassword}
                    autoCapitalize="none"
                    editable={!isSubmitting}
                    onFocus={() => {
                      setFocusedInput('old');
                      scrollToEnd();
                    }}
                    onBlur={() => setFocusedInput(null)}
                    style={[styles.inputField, { color: textColor }]}
                  />
                  <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showOldPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={iconColor} />
                  </TouchableOpacity>
                </View>

                {/* New Password */}
                <ThemedText style={[styles.inputLabel, { color: labelColor }]}>New Password</ThemedText>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: inputBg,
                    borderColor: focusedInput === 'new' ? inputBorderFocused : inputBorderDefault,
                    borderWidth: 1.5
                  }
                ]}>
                  <Ionicons name="key-outline" size={20} color={iconColor} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Min 6 characters"
                    placeholderTextColor={placeholderColor}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    editable={!isSubmitting}
                    onFocus={() => {
                      setFocusedInput('new');
                      scrollToEnd();
                    }}
                    onBlur={() => setFocusedInput(null)}
                    style={[styles.inputField, { color: textColor }]}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={iconColor} />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <ThemedText style={[styles.inputLabel, { color: labelColor }]}>Confirm New Password</ThemedText>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: inputBg,
                    borderColor: focusedInput === 'confirm' ? inputBorderFocused : inputBorderDefault,
                    borderWidth: 1.5
                  }
                ]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={iconColor} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor={placeholderColor}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!isSubmitting}
                    onFocus={() => {
                      setFocusedInput('confirm');
                      scrollToEnd();
                    }}
                    onBlur={() => setFocusedInput(null)}
                    style={[styles.inputField, { color: textColor }]}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={iconColor} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleUpdatePassword}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                  style={styles.submitButtonContainer}
                >
                  <LinearGradient
                    colors={buttonColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButton}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={buttonTextColor} />
                    ) : (
                      <View style={styles.buttonContent}>
                        <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.submitButtonText, { color: buttonTextColor }]}>Update Password</ThemedText>
                        <Ionicons name="checkmark" size={20} color={buttonTextColor} style={{ marginLeft: 8 }} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
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
    marginBottom: 24,
  },
  hiText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 40,
    paddingBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingBottom: 2,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  eyeIcon: {
    padding: 8,
  },
  submitButtonContainer: {
    marginTop: 12,
  },
  submitButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#0A1E40',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
