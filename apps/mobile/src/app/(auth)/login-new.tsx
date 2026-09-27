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
  useWindowDimensions,
  useColorScheme,
  Image,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/store/auth-context';

export default function LoginNewScreen() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const { width } = useWindowDimensions();

  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';

  // Dynamic colors matching light and dark themes
  const gradientColors = isDark 
    ? ['#102E6E', '#060B1E', '#02040A'] as const
    : ['#2567E8', '#1CE6DA'] as const;

  const cardBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#EFF0F6';

  const textColor = isDark ? '#FFFFFF' : '#0B1E40';
  const labelColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#EFF0F6';
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF';
  const inputTextColor = isDark ? '#FFFFFF' : '#0B1E40';

  const buttonBg = isDark ? '#4F7DF9' : '#2567E8';
  const buttonTextColor = isDark ? '#0A1E40' : '#FFFFFF';

  const socialButtonBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
  const socialButtonBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB';
  const socialButtonTextColor = isDark ? '#FFFFFF' : '#1F2937';
  const iconColor = isDark ? '#FFFFFF' : '#1F2937';

  const dividerLineColor = isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB';
  const dividerTextColor = isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF';

  const [loginMode, setLoginMode] = useState<'email' | 'id'>('id');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle auto-routing if user is logged in
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
    alert('QR Code Scanner: This feature will be implemented in a future update.');
  };

  const isTablet = width > 600;

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header logo & brand name */}
            <View style={styles.headerContainer}>
              <Image
                source={require('@/assets/images/app-icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.brandText}>SchoolSaaS</Text>
            </View>

            {/* Login Card */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: isDark ? 1 : 0, maxWidth: isTablet ? 460 : '100%' }]}>
              <Text style={[styles.title, { color: textColor }]}>Login</Text>

              {errorMessage ? (
                <View style={[styles.errorContainer, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1 }]}>
                  <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Email / ID Input Field */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: labelColor }]}>
                  {loginMode === 'email' ? 'Email' : 'School ID / Phone'}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: inputTextColor }]}
                    placeholder={loginMode === 'email' ? 'Enter your email' : 'Enter School ID or Phone'}
                    placeholderTextColor={placeholderColor}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    keyboardType={loginMode === 'email' ? 'email-address' : 'default'}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: labelColor }]}>Password</Text>
                <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: inputTextColor }]}
                    placeholder="Enter your password"
                    placeholderTextColor={placeholderColor}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color={placeholderColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Options Row (Forgot Password) */}
              <View style={styles.optionsRow}>
                <View />
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={[styles.forgotPassword, isDark && { color: '#82F3FF' }]}>Forgot Password ?</Text>
                </TouchableOpacity>
              </View>

              {/* Log In Button */}
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: buttonBg }]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={buttonTextColor} />
                ) : (
                  <Text style={[styles.loginButtonText, { color: buttonTextColor }]}>Log In</Text>
                )}
              </TouchableOpacity>

              {/* Or Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: dividerLineColor }]} />
                <Text style={[styles.dividerText, { color: dividerTextColor }]}>Or</Text>
                <View style={[styles.dividerLine, { backgroundColor: dividerLineColor }]} />
              </View>

              {/* Functional Actions instead of Mock Social Media */}
              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: socialButtonBg, borderColor: socialButtonBorder }]} 
                activeOpacity={0.7}
                onPress={() => {
                  setLoginMode(loginMode === 'email' ? 'id' : 'email');
                  setIdentifier('');
                  setErrorMessage('');
                }}
              >
                <Ionicons 
                  name={loginMode === 'email' ? 'person-outline' : 'mail-outline'} 
                  size={22} 
                  color={iconColor} 
                />
                <Text style={[styles.socialButtonText, { color: socialButtonTextColor }]}>
                  {loginMode === 'email' ? 'Login by ID' : 'Login by Email'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: socialButtonBg, borderColor: socialButtonBorder }]} 
                activeOpacity={0.7}
                onPress={handleScanQRCode}
              >
                <Ionicons name="qr-code-outline" size={22} color={iconColor} />
                <Text style={[styles.socialButtonText, { color: socialButtonTextColor }]}>Scan QR Code</Text>
              </TouchableOpacity>
            </View>

            {/* Flexible spacer to push the footer to the bottom of the screen */}
            <View style={{ flex: 1, minHeight: 20 }} />

            {/* Support Footer */}
            <View style={styles.supportFooter}>
              <Text style={[styles.supportText, isDark && { color: 'rgba(255, 255, 255, 0.4)' }]}>
                For assistance, please contact your school administration.
              </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 40 : 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
  },
  brandText: {
    color: '#EEEEEE',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 28,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#2567E8',
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 56,
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  supportFooter: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  supportText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
