import React from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface TeacherContactInfoSectionProps {
  isDark: boolean;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  alternatePhone?: string;
  setAlternatePhone?: (val: string) => void;
  address?: string;
  setAddress?: (val: string) => void;
}

export function TeacherContactInfoSection({
  isDark,
  email,
  setEmail,
  phone,
  setPhone,
  alternatePhone = '',
  setAlternatePhone,
  address = '',
  setAddress,
}: TeacherContactInfoSectionProps) {
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
        <Ionicons name="call-outline" size={14} color="#059669" />
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          Contact Information
        </ThemedText>
      </View>

      {/* Email Address */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Email Address <ThemedText style={styles.requiredStar}>*</ThemedText>
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
            name="mail-outline"
            size={15}
            color="#94A3B8"
            style={styles.inputLeftIcon}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="teacher@school.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.textInput,
              { color: isDark ? '#F4F4F5' : '#0F172A' },
            ]}
          />
        </View>
      </View>

      {/* Phone Number */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Phone Number
        </ThemedText>
        <View
          style={[
            styles.phoneInputContainer,
            {
              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
            },
          ]}
        >
          <View
            style={[
              styles.countryCodeBadge,
              {
                backgroundColor: isDark ? '#3F3F46' : '#F1F5F9',
                borderRightColor: isDark ? '#4B5563' : '#E2E8F0',
              },
            ]}
          >
            <ThemedText
              style={[
                styles.countryCodeText,
                { color: isDark ? '#D4D4D8' : '#475569' },
              ]}
            >
              +91
            </ThemedText>
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            style={[
              styles.textInput,
              {
                paddingLeft: 10,
                color: isDark ? '#F4F4F5' : '#0F172A',
              },
            ]}
          />
        </View>
      </View>

      {/* Alternate Phone */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Alternate Phone{' '}
          <ThemedText style={styles.optionalText}>(Optional)</ThemedText>
        </ThemedText>
        <View
          style={[
            styles.phoneInputContainer,
            {
              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
            },
          ]}
        >
          <View
            style={[
              styles.countryCodeBadge,
              {
                backgroundColor: isDark ? '#3F3F46' : '#F1F5F9',
                borderRightColor: isDark ? '#4B5563' : '#E2E8F0',
              },
            ]}
          >
            <ThemedText
              style={[
                styles.countryCodeText,
                { color: isDark ? '#D4D4D8' : '#475569' },
              ]}
            >
              +91
            </ThemedText>
          </View>
          <TextInput
            value={alternatePhone}
            onChangeText={(val) => setAlternatePhone && setAlternatePhone(val)}
            placeholder="Enter alternate number"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            style={[
              styles.textInput,
              {
                paddingLeft: 10,
                color: isDark ? '#F4F4F5' : '#0F172A',
              },
            ]}
          />
        </View>
      </View>

      {/* Address */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelWithCounter}>
          <ThemedText
            style={[
              styles.fieldLabel,
              { color: isDark ? '#D4D4D8' : '#334155' },
            ]}
          >
            Address <ThemedText style={styles.optionalText}>(Optional)</ThemedText>
          </ThemedText>
          <ThemedText style={styles.charCounter}>
            {(address || '').length}/200
          </ThemedText>
        </View>
        <TextInput
          value={address}
          onChangeText={(val) => setAddress && setAddress(val)}
          placeholder="Enter full address"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
          maxLength={200}
          style={[
            styles.textAreaInput,
            {
              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              color: isDark ? '#F4F4F5' : '#0F172A',
            },
          ]}
        />
      </View>
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
    gap: 5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  requiredStar: {
    color: '#EF4444',
    fontWeight: '700',
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 40,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    height: '100%',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  countryCodeText: {
    fontSize: 12,
    fontWeight: '600',
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
  labelWithCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    fontSize: 10,
    color: '#94A3B8',
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    minHeight: 56,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
});
