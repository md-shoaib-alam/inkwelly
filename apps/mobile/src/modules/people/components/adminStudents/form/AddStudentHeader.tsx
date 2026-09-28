import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface AddStudentHeaderProps {
  onBack: () => void;
  dialogMode: 'create' | 'edit';
  colors: any;
  isDark: boolean;
}

export function AddStudentHeader({
  onBack,
  dialogMode,
  colors,
  isDark,
}: AddStudentHeaderProps) {
  return (
    <View
      style={[
        styles.headerSection,
        {
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderBottomColor: isDark ? '#27272A' : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          style={[
            styles.backPillBtn,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
              borderColor: isDark ? '#065F46' : '#A7F3D0',
            },
          ]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={16}
            color="#059669"
            style={{ marginRight: 4 }}
          />
          <ThemedText style={styles.backBtnText}>Back to Students</ThemedText>
        </TouchableOpacity>

        <View
          style={[
            styles.modeBadge,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
              borderColor: isDark ? '#065F46' : '#A7F3D0',
            },
          ]}
        >
          <ThemedText style={styles.badgeText}>
            {dialogMode === 'create' ? 'ADD NEW STUDENT' : 'EDIT STUDENT'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.headerTitleRow}>
        <ThemedText
          style={[
            styles.titleText,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          {dialogMode === 'create' ? 'Add New Student' : 'Edit Student Profile'}
        </ThemedText>
        <ThemedText
          style={[
            styles.subtitleText,
            { color: isDark ? '#A1A1AA' : '#64748B' },
          ]}
        >
          {dialogMode === 'create'
            ? 'Fill in the details below. A unique School ID will be generated automatically for login.'
            : 'Update the student information below and save your changes.'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#059669',
  },
  headerTitleRow: {
    gap: 3,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
});
