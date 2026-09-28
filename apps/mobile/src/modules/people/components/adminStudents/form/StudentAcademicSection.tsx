import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface StudentAcademicSectionProps {
  isDark: boolean;
  classId: string;
  onOpenClassPicker: () => void;
  selectedClassName?: string;
  rollNumber: string;
  setRollNumber: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  dialogMode: 'create' | 'edit';
}

export function StudentAcademicSection({
  isDark,
  classId,
  onOpenClassPicker,
  selectedClassName,
  rollNumber,
  setRollNumber,
  username,
  setUsername,
  dialogMode,
}: StudentAcademicSectionProps) {
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
        <Ionicons name="school-outline" size={15} color="#059669" />
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          Academic Information
        </ThemedText>
      </View>

      {/* Class Selector */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Class <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <TouchableOpacity
          onPress={onOpenClassPicker}
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
            name="easel-outline"
            size={15}
            color="#94A3B8"
            style={styles.inputLeftIcon}
          />
          <ThemedText
            style={[
              styles.textInput,
              {
                lineHeight: 40,
                color: classId
                  ? isDark
                    ? '#F4F4F5'
                    : '#0F172A'
                  : '#94A3B8',
              },
            ]}
          >
            {selectedClassName || 'Select Class'}
          </ThemedText>
          <Ionicons name="chevron-down" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Roll Number */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Roll Number <ThemedText style={styles.requiredStar}>*</ThemedText>
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
          <ThemedText style={[styles.hashPrefix, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
            #
          </ThemedText>
          <TextInput
            value={rollNumber}
            onChangeText={setRollNumber}
            placeholder="Enter roll number"
            placeholderTextColor="#94A3B8"
            style={[
              styles.textInput,
              { color: isDark ? '#F4F4F5' : '#0F172A' },
            ]}
          />
        </View>
      </View>

      {/* School Login ID */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          School Login ID
        </ThemedText>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDark ? '#202024' : '#F1F5F9',
              borderColor: isDark ? '#3F3F46' : '#E2E8F0',
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={14}
            color="#94A3B8"
            style={styles.inputLeftIcon}
          />
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder={dialogMode === 'create' ? 'Auto-generated' : 'School Login ID'}
            placeholderTextColor="#94A3B8"
            editable={dialogMode !== 'create'}
            style={[
              styles.textInput,
              { color: isDark ? '#F4F4F5' : '#0F172A' },
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
  hashPrefix: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
});
