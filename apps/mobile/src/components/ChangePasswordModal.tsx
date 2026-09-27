import React, { useState } from 'react';
import { StyleSheet, View, Alert, Modal, TextInput, TouchableOpacity, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { api, removeRefreshToken } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ChangePasswordModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function ChangePasswordModal({ visible, onDismiss }: ChangePasswordModalProps) {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [focusedInput, setFocusedInput] = useState<'old' | 'new' | 'confirm' | null>(null);

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setIsSubmitting(false);
    setFocusedInput(null);
    onDismiss();
  };

  const handleSubmit = async () => {
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
              handleClose();
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={['#0F2042', '#061024']}
            style={styles.modalContent}
          >
          {/* Top Header */}
          <View style={styles.topHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="key" size={24} color="#56E6FF" />
            </View>
            <ThemedText style={styles.title}>Change Password</ThemedText>
            <ThemedText style={styles.description}>
              Enter your current password and choose a secure new one.
            </ThemedText>
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#FF453A" style={{ marginRight: 6 }} />
                <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
              </View>
            ) : null}

            {/* Current Password */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Current Password</ThemedText>
              <View style={[
                styles.inputFieldContainer, 
                { 
                  borderColor: focusedInput === 'old' ? '#56E6FF' : 'rgba(255, 255, 255, 0.12)',
                }
              ]}>
                <TextInput
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry={!showOldPassword}
                  placeholder="Current Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={styles.inputField}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('old')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  onPress={() => setShowOldPassword(!showOldPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons name={showOldPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255, 255, 255, 0.5)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>New Password</ThemedText>
              <View style={[
                styles.inputFieldContainer, 
                { 
                  borderColor: focusedInput === 'new' ? '#56E6FF' : 'rgba(255, 255, 255, 0.12)',
                }
              ]}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={styles.inputField}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('new')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255, 255, 255, 0.5)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Confirm New Password</ThemedText>
              <View style={[
                styles.inputFieldContainer, 
                { 
                  borderColor: focusedInput === 'confirm' ? '#56E6FF' : 'rgba(255, 255, 255, 0.12)',
                }
              ]}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Confirm New Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={styles.inputField}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('confirm')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255, 255, 255, 0.5)" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={handleClose} 
              disabled={isSubmitting}
              style={[styles.btn, styles.cancelBtn]}
            >
              <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.btn, styles.submitBtn]}
            >
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF', '#12D0F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#0A1E40" />
                ) : (
                  <ThemedText style={styles.submitBtnText}>Update Password</ThemedText>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  topHeader: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(86, 230, 255, 0.15)',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  content: {
    paddingVertical: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 23,
    height: 46,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any
    })
  },
  eyeBtn: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelBtnText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    fontSize: 14,
  },
  submitBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 23,
  },
  submitBtnText: {
    color: '#0A1E40',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
