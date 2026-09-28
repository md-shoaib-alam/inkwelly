import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface TeacherProfessionalSectionProps {
  isDark: boolean;
  role: string;
  subjects: string;
  setSubjects: (val: string) => void;
  joiningDate: string;
  onOpenJoiningDatePicker: () => void;
}

const AVAILABLE_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Social Studies',
  'Computer Science',
  'Hindi',
];

export function TeacherProfessionalSection({
  isDark,
  role = 'Faculty Member',
  subjects,
  setSubjects,
  joiningDate,
  onOpenJoiningDatePicker,
}: TeacherProfessionalSectionProps) {
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
        <Ionicons name="briefcase-outline" size={14} color="#059669" />
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          Professional Information
        </ThemedText>
      </View>

      {/* Role (Fixed) */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Role <ThemedText style={styles.optionalText}>(Teacher)</ThemedText>
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
            {role || 'Faculty Member'}
          </ThemedText>
          <Ionicons
            name="lock-closed"
            size={12}
            color={isDark ? '#71717A' : '#94A3B8'}
          />
        </View>
      </View>

      {/* Subject Selector */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Subject(s) <ThemedText style={styles.optionalText}>(Optional)</ThemedText>
        </ThemedText>
        <View style={styles.chipsContainer}>
          {AVAILABLE_SUBJECTS.map((sub) => {
            const isSelected = subjects === sub;
            return (
              <TouchableOpacity
                key={sub}
                onPress={() => setSubjects(sub)}
                activeOpacity={0.7}
                style={[
                  styles.chipBtn,
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
                    styles.chipText,
                    isSelected
                      ? { color: '#FFFFFF', fontWeight: '700' }
                      : { color: isDark ? '#D4D4D8' : '#475569' },
                  ]}
                >
                  {sub}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Date of Joining */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Date of Joining <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <TouchableOpacity
          onPress={onOpenJoiningDatePicker}
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
                color: joiningDate
                  ? isDark
                    ? '#F4F4F5'
                    : '#0F172A'
                  : '#94A3B8',
              },
            ]}
          >
            {joiningDate || 'Pick date of joining'}
          </ThemedText>
        </TouchableOpacity>
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
  textInput: {
    flex: 1,
    fontSize: 12,
    height: '100%',
    fontWeight: '500',
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  readonlyText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  chipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
