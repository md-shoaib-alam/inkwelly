import React from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface AddressSectionProps {
  isDark: boolean;
  address?: string;
  setAddress?: (val: string) => void;
}

export function AddressSection({
  isDark,
  address,
  setAddress,
}: AddressSectionProps) {
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
        <Ionicons name="location-outline" size={14} color="#059669" />
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          Address Information
        </ThemedText>
      </View>

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
          numberOfLines={3}
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
  optionalText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94A3B8',
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
    minHeight: 64,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
});
