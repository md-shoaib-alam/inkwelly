import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface AccountSettingsSectionProps {
  isDark: boolean;
  dialogMode: 'create' | 'edit';
  username: string;
  setUsername: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
  showPassword?: boolean;
  setShowPassword?: (fn: (prev: boolean) => boolean) => void;
}

export function AccountSettingsSection({
  isDark,
  dialogMode,
  username,
  setUsername,
  password = '',
  setPassword,
  showPassword = false,
  setShowPassword,
}: AccountSettingsSectionProps) {
  const { width } = useWindowDimensions();
  // Activate 2-col layout at 500px (portrait phones included)
  const isTablet = width >= 500;

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: isDark ? '#1F1F23' : '#FFFFFF',
          borderColor: isDark ? '#2E2E33' : '#E2E8F0',
        },
      ]}
    >
      <View
        style={[
          styles.sectionHeader,
          { borderBottomColor: isDark ? '#27272A' : '#F1F5F9' },
        ]}
      >
        <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          Account Settings
        </ThemedText>
      </View>

      {/* Row: Parent Login ID & Login Password (2-cols on tablet) */}
      <View style={[styles.fieldsContainer, isTablet && styles.fieldsRow]}>
        {/* Parent Login ID */}
        <View style={[styles.fieldGroup, isTablet && styles.fieldGroup2Col]}>
          <ThemedText
            style={[
              styles.fieldLabel,
              { color: isDark ? '#D4D4D8' : '#334155' },
            ]}
          >
            Parent Login ID
          </ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDark ? '#202024' : '#F1F5F9',
                borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                opacity: dialogMode === 'edit' ? 0.7 : 1,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.hashPrefix,
                { color: isDark ? '#A1A1AA' : '#64748B' },
              ]}
            >
              #
            </ThemedText>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Auto-generate"
              placeholderTextColor="#94A3B8"
              editable={dialogMode === 'create'}
              autoCapitalize="none"
              style={[
                styles.textInput,
                {
                  paddingLeft: 4,
                  color: isDark ? '#F4F4F5' : '#0F172A',
                },
              ]}
            />
          </View>
        </View>

        {/* Login Password (if creating) */}
        {dialogMode === 'create' && setPassword && (
          <View style={[styles.fieldGroup, isTablet && styles.fieldGroup2Col]}>
            <ThemedText
              style={[
                styles.fieldLabel,
                { color: isDark ? '#D4D4D8' : '#334155' },
              ]}
            >
              Login Password
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                  borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={15}
                color="#94A3B8"
                style={styles.inputLeftIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Set login password (default: changeme123)"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={[
                  styles.textInput,
                  { color: isDark ? '#F4F4F5' : '#0F172A' },
                ]}
              />
              {setShowPassword && (
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Info notice box */}
      <View
        style={[
          styles.infoNoticeBox,
          {
            backgroundColor: isDark
              ? 'rgba(14, 165, 233, 0.1)'
              : '#F0F9FF',
            borderColor: isDark ? '#0369A1' : '#BAE6FD',
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={16}
          color="#0284C7"
          style={{ marginRight: 8, marginTop: 1 }}
        />
        <ThemedText
          style={[
            styles.infoNoticeText,
            { color: isDark ? '#BAE6FD' : '#0369A1' },
          ]}
        >
          The parent will use this Login ID and password to access the parent portal. You can share the credentials with them after creation.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  fieldsContainer: {
    gap: 12,
  },
  fieldsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldGroup2Col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 12.5,
    height: '100%',
    fontWeight: '500',
  },
  hashPrefix: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  infoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
});
