import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface StudentAdditionalSectionProps {
  isDark: boolean;
  bloodGroup: string;
  setBloodGroup: (val: string) => void;
  parentId: string;
  onOpenParentPicker: () => void;
  selectedParentName?: string;
  transportEnabled: boolean;
  setTransportEnabled: (val: boolean) => void;
  routeId: string;
  onOpenRoutePicker: () => void;
  selectedRouteName?: string;
  pickupPoint: string;
  onOpenPickupPicker: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function StudentAdditionalSection({
  isDark,
  bloodGroup,
  setBloodGroup,
  parentId,
  onOpenParentPicker,
  selectedParentName,
  transportEnabled,
  setTransportEnabled,
  routeId,
  onOpenRoutePicker,
  selectedRouteName,
  pickupPoint,
  onOpenPickupPicker,
}: StudentAdditionalSectionProps) {
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
        <Ionicons name="document-text-outline" size={15} color="#059669" />
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F4F4F5' : '#0F172A' },
          ]}
        >
          Additional Details
        </ThemedText>
      </View>

      {/* Blood Group Chips */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Blood Group <ThemedText style={styles.optionalText}>(Optional)</ThemedText>
        </ThemedText>
        <View style={styles.chipsContainer}>
          {BLOOD_GROUPS.map((bg) => {
            const isSelected = bloodGroup === bg;
            return (
              <TouchableOpacity
                key={bg}
                onPress={() => setBloodGroup(isSelected ? '' : bg)}
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
                  {bg}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Linked Parent Selector */}
      <View style={styles.fieldGroup}>
        <ThemedText
          style={[
            styles.fieldLabel,
            { color: isDark ? '#D4D4D8' : '#334155' },
          ]}
        >
          Linked Parent / Guardian <ThemedText style={styles.optionalText}>(Optional)</ThemedText>
        </ThemedText>
        <TouchableOpacity
          onPress={onOpenParentPicker}
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
            name="people-outline"
            size={15}
            color="#94A3B8"
            style={styles.inputLeftIcon}
          />
          <ThemedText
            style={[
              styles.textInput,
              {
                lineHeight: 40,
                color: parentId
                  ? isDark
                    ? '#F4F4F5'
                    : '#0F172A'
                  : '#94A3B8',
              },
            ]}
          >
            {selectedParentName || 'Link to Parent (Optional)'}
          </ThemedText>
          <Ionicons name="chevron-down" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Transport Service Toggle */}
      <View style={styles.transportContainer}>
        <View style={styles.transportToggleRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.transportTitleWrap}>
              <Ionicons name="bus-outline" size={16} color="#059669" />
              <ThemedText
                style={[
                  styles.transportTitle,
                  { color: isDark ? '#F4F4F5' : '#0F172A' },
                ]}
              >
                Transport Service
              </ThemedText>
            </View>
            <ThemedText style={styles.transportSubtitle}>
              Enable if this student uses school transport
            </ThemedText>
          </View>
          <Switch
            value={transportEnabled}
            onValueChange={setTransportEnabled}
            color="#059669"
          />
        </View>

        {transportEnabled ? (
          <View style={styles.transportFields}>
            {/* Route Selection */}
            <View style={styles.fieldGroup}>
              <ThemedText
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#D4D4D8' : '#334155' },
                ]}
              >
                Transport Route <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <TouchableOpacity
                onPress={onOpenRoutePicker}
                activeOpacity={0.7}
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                    borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.textInput,
                    {
                      lineHeight: 40,
                      color: routeId
                        ? isDark
                          ? '#F4F4F5'
                          : '#0F172A'
                        : '#94A3B8',
                    },
                  ]}
                >
                  {selectedRouteName || 'Select a route'}
                </ThemedText>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Pickup Point Selection */}
            {routeId ? (
              <View style={styles.fieldGroup}>
                <ThemedText
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? '#D4D4D8' : '#334155' },
                  ]}
                >
                  Pickup Point <ThemedText style={styles.requiredStar}>*</ThemedText>
                </ThemedText>
                <TouchableOpacity
                  onPress={onOpenPickupPicker}
                  activeOpacity={0.7}
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                      borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.textInput,
                      {
                        lineHeight: 40,
                        color: pickupPoint
                          ? isDark
                            ? '#F4F4F5'
                            : '#0F172A'
                          : '#94A3B8',
                      },
                    ]}
                  >
                    {pickupPoint || 'Choose pickup point'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isDark ? '#064E3B20' : '#ECFDF5',
                borderColor: isDark ? '#065F46' : '#A7F3D0',
              },
            ]}
          >
            <Ionicons name="information-circle" size={16} color="#059669" />
            <ThemedText style={[styles.infoBoxText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
              Transport details will be available after enabling this option.
            </ThemedText>
          </View>
        )}
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
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
    fontSize: 12,
    height: '100%',
    fontWeight: '500',
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  transportContainer: {
    paddingTop: 8,
    gap: 10,
  },
  transportToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transportTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transportTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  transportSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  transportFields: {
    gap: 10,
    paddingTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBoxText: {
    fontSize: 11,
    flex: 1,
    fontWeight: '500',
  },
});
