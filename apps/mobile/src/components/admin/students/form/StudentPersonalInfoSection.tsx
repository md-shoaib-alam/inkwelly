import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface StudentPersonalInfoSectionProps {
  isDark: boolean;
  name: string;
  setName: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  dateOfBirth: string;
  onOpenDobPicker: () => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
}

export function StudentPersonalInfoSection({
  isDark,
  name,
  setName,
  gender = 'male',
  setGender,
  dateOfBirth,
  onOpenDobPicker,
  email,
  setEmail,
  phone,
  setPhone,
}: StudentPersonalInfoSectionProps) {
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
        <Ionicons name="person-outline" size={15} color="#059669" />
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          Personal Information
        </ThemedText>
      </View>

      {/* Full Name */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Full Name <ThemedText style={styles.requiredStar}>*</ThemedText>
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
            name="person-outline"
            size={15}
            color="#94A3B8"
            style={styles.inputLeftIcon}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            placeholderTextColor="#94A3B8"
            style={[
              styles.textInput,
              { color: isDark ? '#F4F4F5' : '#0F172A' },
            ]}
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Gender Selector */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Gender
        </ThemedText>
        <View style={styles.genderPillsContainer}>
          {(['male', 'female', 'other'] as const).map((g) => {
            const isSelected = (gender || 'male').toLowerCase() === g;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                activeOpacity={0.7}
                style={[
                  styles.genderPill,
                  isSelected
                    ? {
                        backgroundColor: '#059669',
                        borderColor: '#059669',
                      }
                    : {
                        backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                        borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                      },
                ]}
              >
                <ThemedText
                  style={[
                    styles.genderPillText,
                    isSelected
                      ? { color: '#FFFFFF', fontWeight: '700' }
                      : { color: isDark ? '#A1A1AA' : '#64748B' },
                  ]}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Date of Birth */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Date of Birth <ThemedText style={styles.optionalText}>(Optional)</ThemedText>
        </ThemedText>
        <TouchableOpacity
          onPress={onOpenDobPicker}
          activeOpacity={0.7}
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDark ? '#27272A' : '#F8FAFC',
              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color="#94A3B8"
            style={styles.inputLeftIcon}
          />
          <ThemedText
            style={[
              styles.textInput,
              {
                lineHeight: 40,
                color: dateOfBirth
                  ? isDark
                    ? '#F4F4F5'
                    : '#0F172A'
                  : '#94A3B8',
              },
            ]}
          >
            {dateOfBirth || 'Pick date of birth'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Email Address */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Email Address <ThemedText style={styles.optionalText}>(Optional)</ThemedText>
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
            placeholder="student@school.com"
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
          Phone Number <ThemedText style={styles.optionalText}>(Optional)</ThemedText>
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
  genderPillsContainer: {
    flexDirection: 'row',
    gap: 6,
    height: 40,
    alignItems: 'center',
  },
  genderPill: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
