import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface TeacherAccountSettingsSectionProps {
  isDark: boolean;
  dialogMode: 'create' | 'edit';
  status: string;
  setStatus: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
  showPassword?: boolean;
  setShowPassword?: (fn: (prev: boolean) => boolean) => void;
}

const STATUS_OPTIONS = [
  { id: 'active', label: 'Active', dotColor: '#10B981' },
  { id: 'inactive', label: 'Inactive', dotColor: '#6B7280' },
  { id: 'on_leave', label: 'On Leave', dotColor: '#F59E0B' },
];

export function TeacherAccountSettingsSection({
  isDark,
  dialogMode,
  status = 'active',
  setStatus,
  password = '',
  setPassword,
  showPassword = false,
  setShowPassword,
}: TeacherAccountSettingsSectionProps) {
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
        <Ionicons name="checkmark-circle-outline" size={15} color="#059669" />
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          Account Settings
        </ThemedText>
      </View>

      {/* Status Selector */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Status
        </ThemedText>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = (status || 'active').toLowerCase() === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setStatus(opt.id)}
                activeOpacity={0.7}
                style={[
                  styles.statusPill,
                  isSelected
                    ? {
                        backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5',
                        borderColor: '#059669',
                      }
                    : {
                        backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                        borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                      },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: opt.dotColor }]} />
                <ThemedText
                  style={[
                    styles.statusPillText,
                    isSelected
                      ? { color: '#059669', fontWeight: '700' }
                      : { color: isDark ? '#A1A1AA' : '#64748B' },
                  ]}
                >
                  {opt.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
        <ThemedText style={styles.statusHintText}>
          Inactive teachers will not be able to log in to the system.
        </ThemedText>
      </View>

      {/* Password field (if creating) */}
      {dialogMode === 'create' && setPassword && (
        <View style={styles.fieldGroup}>
          <ThemedText
            style={[
              styles.fieldLabel,
              { color: isDark ? '#D4D4D8' : '#334155' },
            ]}
          >
            Login Password <ThemedText style={styles.requiredStar}>*</ThemedText>
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
                style={styles.inputRightIcon}
                activeOpacity={0.7}
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
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  requiredStar: {
    color: '#EF4444',
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusHintText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
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
    fontSize: 12,
    height: '100%',
    fontWeight: '500',
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  inputRightIcon: {
    padding: 6,
  },
});
