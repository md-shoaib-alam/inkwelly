import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface AddParentHeaderProps {
  onBack: () => void;
  dialogMode: 'create' | 'edit';
  colors: any;
  isDark: boolean;
}

export function AddParentHeader({
  onBack,
  dialogMode,
  colors,
  isDark,
}: AddParentHeaderProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 650;

  return (
    <View
      style={[
        styles.headerSection,
        {
          backgroundColor: colors.background || '#FFFFFF',
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
          <ThemedText style={styles.backBtnText}>Back to Parents</ThemedText>
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
            {dialogMode === 'create' ? 'ADD NEW PARENT' : 'EDIT PARENT'}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.headerContentRow, isTablet && styles.headerContentRowTablet]}>
        <View style={styles.headerTitleRow}>
          <ThemedText
            style={[
              styles.titleText,
              { color: isDark ? '#F4F4F5' : '#0F172A' },
            ]}
          >
            {dialogMode === 'create' ? 'Add New Parent' : 'Edit Parent'}
          </ThemedText>
          <ThemedText
            style={[
              styles.subtitleText,
              { color: isDark ? '#A1A1AA' : '#64748B' },
            ]}
          >
            {dialogMode === 'create'
              ? 'Create a new parent account in the system. A unique Parent ID (e.g. PRN2026xxxx) will be automatically generated for login.'
              : 'Update parent information and portal account credentials.'}
          </ThemedText>
        </View>

        {/* Decorative graphic image on Tablet */}
        {isTablet && (
          <Image
            source={require('@/../assets/images/admin/parentaddtop.avif')}
            style={styles.headerIllustration}
            resizeMode="contain"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
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
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContentRowTablet: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  headerIllustration: {
    width: 130,
    height: 70,
  },
});
