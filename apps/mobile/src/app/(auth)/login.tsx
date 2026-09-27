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
  Image, 
  Dimensions, 
  useWindowDimensions,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/store/auth-context';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const { width, height } = useWindowDimensions();

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
  const dividerLineColors = isDark 
    ? ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.15)'] as const
    : ['rgba(11, 30, 64, 0)', 'rgba(11, 30, 64, 0.15)'] as const;
  const dividerLineColorsReverse = isDark
    ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0)'] as const
    : ['rgba(11, 30, 64, 0.15)', 'rgba(11, 30, 64, 0)'] as const;

  const [loginMode, setLoginMode] = useState<'email' | 'id'>('id');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const passwordInputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        router.replace('/(superadmin)/(tabs)/web-version');
      } else if (user.role === 'admin') {
        router.replace('/(admin)/(tabs)/dashboard');
      } else if (user.role === 'teacher') {
        router.replace('/(teacher)/(tabs)/dashboard');
      } else if (user.role === 'parent') {
        router.replace('/(parent)/(tabs)/dashboard');
      } else if (user.role === 'staff') {
        router.replace('/(staff)/(tabs)/dashboard');
      } else {
        router.replace('/(student)/(tabs)/dashboard');
      }
    }
  }, [user]);

  const handleLogin = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password.trim()) {
      setErrorMessage(
        loginMode === 'email'
          ? 'Please enter both your Email ID and password.'
          : 'Please enter both your School ID/Phone and password.'
      );
      return;
    }

    const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier);
    
    if (loginMode === 'id' && isEmailFormat) {
      setErrorMessage('Invalid School ID/Phone or password');
      return;
    }
    
    if (loginMode === 'email' && !isEmailFormat) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    try {
      await login(trimmedIdentifier, password.trim());
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleScanQRCode = () => {
    // TODO: add that feature later for qr code scan
    alert('QR Code Scanner: This feature will be implemented in a future update.');
  };

  // Determine if tablet or landscape mode to adjust padding
  const isTablet = width > 600;
  const isLandscape = width > height;

  return (
    <LinearGradient 
      colors={gradientColors} 
      style={styles.container}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Top Header Bar inside SafeAreaView */}
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.topHeaderBar}>
        <Image
          source={require('@/assets/images/app-icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.brandTitle, { color: textColor }]}>SchoolSaaS</ThemedText>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { 
              paddingVertical: isLandscape ? 10 : 20,
              justifyContent: isLandscape ? 'flex-start' : 'center'
            }
          ]} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.cardContainer, { maxWidth: isTablet ? 500 : 440 }]}>
            
            {/* Header Greetings */}
            <View style={styles.headerTextContainer}>
              <ThemedText style={[styles.hiText, { color: textColor }]}>Welcome Back!</ThemedText>
              <ThemedText style={[styles.subtitleText, { color: subtitleColor }]}>Sign in to access your portal.</ThemedText>
            </View>

            {/* Error Message Box */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#FF453A" style={{ marginRight: 8 }} />
                <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.formContainer}>
              
              {/* Username/Email Input */}
              <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <Ionicons 
                  name={loginMode === 'email' ? 'mail-outline' : 'id-card-outline'} 
                  size={20} 
                  color={iconColor} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  placeholder={loginMode === 'email' ? 'Email address' : 'School ID / Phone'}
                  placeholderTextColor={placeholderColor}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType={loginMode === 'email' ? 'email-address' : 'default'}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  blurOnSubmit={false}
                  style={[styles.inputField, { color: textColor }]}
                />
              </View>

              {/* Password Input */}
              <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <Ionicons name="lock-closed-outline" size={20} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  placeholder="Password"
                  placeholderTextColor={placeholderColor}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={[styles.inputField, { color: textColor }]}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={iconColor} />
                </TouchableOpacity>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.forgotPasswordText, { color: isDark ? '#FFFFFF' : '#007AFF', opacity: isDark ? 0.9 : 1 }]}>
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              {/* Primary Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={buttonColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={buttonTextColor} />
                  ) : (
                    <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.loginButtonText, { color: buttonTextColor }]}>Log In</ThemedText>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </View>

            {/* Separator / Or */}
            <View style={styles.dividerContainer}>
              <LinearGradient
                colors={dividerLineColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dividerLine}
              />
              <ThemedText style={[styles.dividerText, { color: subtitleColor }]}>Or</ThemedText>
              <LinearGradient
                colors={dividerLineColorsReverse}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dividerLine}
              />
            </View>

            {/* Secondary Buttons (Now at the bottom) */}
            <View style={styles.socialButtonsContainer}>
              {/* Toggle Login Mode (Login by Email / Login by School ID) */}
              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: inputBg, borderColor: inputBorder }]} 
                onPress={() => {
                  setLoginMode(loginMode === 'email' ? 'id' : 'email');
                  setIdentifier('');
                  setErrorMessage('');
                }}
              >
                <Ionicons 
                  name={loginMode === 'email' ? 'person-outline' : 'mail-outline'} 
                  size={20} 
                  color={textColor} 
                  style={{ marginRight: 8 }} 
                />
                <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.socialButtonText, { color: textColor }]}>
                  {loginMode === 'email' ? 'Login by ID' : 'Login by Email'}
                </ThemedText>
              </TouchableOpacity>

              {/* Scan QR Code Option */}
              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: inputBg, borderColor: inputBorder }]} 
                onPress={handleScanQRCode}
              >
                <Ionicons name="qr-code-outline" size={20} color={textColor} style={{ marginRight: 8 }} />
                <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.socialButtonText, { color: textColor }]}>Scan QR Code</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Dev Helper Action */}
            <TouchableOpacity
              style={styles.devResetButton}
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem('@onboarding_complete');
                  alert('Onboarding reset successfully! Reload/restart the app to see it.');
                } catch (err) {
                  console.warn('Failed to reset onboarding state in AsyncStorage', err);
                }
              }}
            >
              <ThemedText style={[styles.devResetText, { color: subtitleColor }]}>
                [Dev Tool] Reset Onboarding State
              </ThemedText>
            </TouchableOpacity>

            {/* Support Footer */}
            <View style={styles.supportFooter}>
              <ThemedText style={[styles.supportText, { color: subtitleColor }]}>
                For assistance, please contact your school administration.
              </ThemedText>
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
  scrollContent: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  cardContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 32,
    paddingBottom: 2,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  hiText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
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
    marginBottom: 16,
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
  eyeIcon: {
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  loginButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  loginButtonText: {
    color: '#0A1E40',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  signUpLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
    justifyContent: 'center',
  },
  dividerLine: {
    width: 250,
    height: 1,
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  socialButton: {
    flex: 0.48,
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  devResetButton: {
    padding: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  devResetText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  supportFooter: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  supportText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    includeFontPadding: false,
  },
});
