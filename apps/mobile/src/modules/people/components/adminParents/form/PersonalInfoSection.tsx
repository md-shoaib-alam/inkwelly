import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface PersonalInfoSectionProps {
  isDark: boolean;
  name: string;
  setName: (val: string) => void;
  gender: string;
  setGender?: (val: string) => void;
  dateOfBirth: string;
  onOpenDobPicker: () => void;
  occupation: string;
  setOccupation: (val: string) => void;
}

export function PersonalInfoSection({
  isDark,
  name,
  setName,
  gender,
  setGender,
  dateOfBirth,
  onOpenDobPicker,
  occupation,
  setOccupation,
}: PersonalInfoSectionProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  // Portrait ≥ 500 → 2 cols | Landscape ≥ 500 → 3 cols | narrow → 1 col
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
        <FontAwesome5 name="user" size={13} color="#059669" />
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          Personal Information
        </ThemedText>
      </View>

      {/* Row 1: Full Name, Gender, Relationship — 2 cols portrait / 3 cols landscape */}
      <View style={[styles.fieldsContainer, isTablet && styles.fieldsRow, isTablet && { flexWrap: 'wrap' }]}>
        {/* Full Name */}
        <View style={[styles.fieldGroup, isTablet && { width: isLandscape ? '31%' : '48%' }]}>
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
        <View style={[styles.fieldGroup, isTablet && { width: isLandscape ? '31%' : '48%' }]}>
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
                  onPress={() => setGender && setGender(g)}
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

        {/* Relationship (Fixed Parent) */}
        <View style={[styles.fieldGroup, isTablet && { width: isLandscape ? '31%' : '100%' }]}>
          <ThemedText
            style={[
              styles.fieldLabel,
              { color: isDark ? '#D4D4D8' : '#334155' },
            ]}
          >
            Relationship with Student(s) <ThemedText style={styles.optionalText}>(Parent)</ThemedText>
          </ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDark ? '#202024' : '#F1F5F9',
                borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                paddingHorizontal: 12,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.readonlyText,
                { color: isDark ? '#A1A1AA' : '#64748B' },
              ]}
            >
              Parent
            </ThemedText>
            <Ionicons
              name="lock-closed"
              size={12}
              color={isDark ? '#71717A' : '#94A3B8'}
            />
          </View>
        </View>
      </View>

      {/* Row 2: Date of Birth & Occupation — 2 cols always when ≥ 500px */}
      <View style={[styles.fieldsContainer, isTablet && styles.fieldsRow]}>
        {/* Date of Birth */}
        <View style={[styles.fieldGroup, isTablet && styles.fieldGroup2Col]}>
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

        {/* Occupation */}
        <View style={[styles.fieldGroup, isTablet && styles.fieldGroup2Col]}>
          <ThemedText
            style={[
              styles.fieldLabel,
              { color: isDark ? '#D4D4D8' : '#334155' },
            ]}
          >
            Occupation <ThemedText style={styles.optionalText}>(Optional)</ThemedText>
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
              name="briefcase-outline"
              size={15}
              color="#94A3B8"
              style={styles.inputLeftIcon}
            />
            <TextInput
              value={occupation}
              onChangeText={setOccupation}
              placeholder="e.g. Engineer, Business"
              placeholderTextColor="#94A3B8"
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
  fieldGroup3Col: {
    flex: 1,
  },
  fieldGroup2Col: {
    flex: 1,
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
  textInput: {
    flex: 1,
    fontSize: 12.5,
    height: '100%',
    fontWeight: '500',
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  readonlyText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
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
    fontSize: 11.5,
    fontWeight: '600',
  },
});
