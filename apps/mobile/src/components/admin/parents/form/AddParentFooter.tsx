import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Ionicons, Feather } from '@expo/vector-icons';

interface AddParentFooterProps {
  dialogMode: 'create' | 'edit';
  isDark: boolean;
  isSubmitting: boolean;
  isFormValid: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onReset?: () => void;
}

export function AddParentFooter({
  dialogMode,
  isDark,
  isSubmitting,
  isFormValid,
  onBack,
  onSubmit,
  onReset,
}: AddParentFooterProps) {
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 12);

  return (
    <View
      style={[
        styles.screenFooter,
        {
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderTopColor: isDark ? '#27272A' : '#F1F5F9',
          paddingBottom: 12 + bottomGap,
        },
      ]}
    >
      {dialogMode === 'create' && onReset ? (
        <TouchableOpacity
          onPress={onReset}
          activeOpacity={0.7}
          style={[
            styles.resetBtn,
            {
              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              backgroundColor: isDark ? '#27272A' : '#FFFFFF',
            },
          ]}
        >
          <Feather
            name="rotate-ccw"
            size={13}
            color={isDark ? '#D4D4D8' : '#475569'}
          />
          <ThemedText
            style={[
              styles.resetBtnText,
              { color: isDark ? '#D4D4D8' : '#475569' },
            ]}
          >
            Reset
          </ThemedText>
        </TouchableOpacity>
      ) : (
        <View />
      )}

      <View style={styles.footerActionBtns}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={[
            styles.cancelBtn,
            {
              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              backgroundColor: isDark ? '#27272A' : '#FFFFFF',
            },
          ]}
        >
          <ThemedText
            style={[
              styles.cancelBtnText,
              { color: isDark ? '#D4D4D8' : '#475569' },
            ]}
          >
            Cancel
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSubmit}
          activeOpacity={0.8}
          disabled={isSubmitting || !isFormValid}
          style={[
            styles.submitBtn,
            (!isFormValid || isSubmitting) && styles.submitBtnDisabled,
          ]}
        >
          <Ionicons
            name={dialogMode === 'create' ? 'add' : 'checkmark'}
            size={16}
            color="#FFFFFF"
          />
          <ThemedText style={styles.submitBtnText}>
            {isSubmitting
              ? 'Saving...'
              : dialogMode === 'create'
              ? 'Create Parent'
              : 'Save Changes'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
