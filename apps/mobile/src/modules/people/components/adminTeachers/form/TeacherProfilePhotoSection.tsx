import React from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface TeacherProfilePhotoSectionProps {
  isDark: boolean;
  name: string;
}

export function TeacherProfilePhotoSection({
  isDark,
  name,
}: TeacherProfilePhotoSectionProps) {
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

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
      <View style={styles.sectionHeader}>
        <Ionicons name="camera-outline" size={16} color="#059669" />
        <View style={{ flex: 1 }}>
          <ThemedText
            style={[
              styles.sectionTitle,
              { color: isDark ? '#F4F4F5' : '#0F172A' },
            ]}
          >
            Profile Photo
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Upload a clear photo of the teacher (Optional)
          </ThemedText>
        </View>
      </View>

      <View style={styles.avatarActionRow}>
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5',
              borderColor: isDark ? '#065F46' : '#A7F3D0',
            },
          ]}
        >
          {initials ? (
            <ThemedText style={styles.avatarText}>{initials}</ThemedText>
          ) : (
            <Ionicons name="person" size={26} color="#059669" />
          )}
        </View>

        <View style={styles.uploadBtnContainer}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                borderColor: isDark ? '#3F3F46' : '#E2E8F0',
              },
            ]}
            onPress={() => Alert.alert('Upload Photo', 'Photo upload feature will be available with storage sync.')}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload-outline" size={15} color="#059669" style={{ marginRight: 6 }} />
            <ThemedText style={[styles.uploadButtonText, { color: isDark ? '#F4F4F5' : '#1E293B' }]}>
              Upload Photo
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.formatHint}>JPG, PNG up to 5MB</ThemedText>
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
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 4,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
  },
  uploadBtnContainer: {
    gap: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formatHint: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
