import React from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import type { Parent, Child } from '../types';
import { EMERALD } from './types';

interface ParentChildrenTabProps {
  parent: Parent;
  canEdit?: boolean;
  onLinkChildClick?: () => void;
  onUnlinkChildClick?: (child: Child) => void;
}

export function ParentChildrenTab({
  parent,
  canEdit = true,
  onLinkChildClick,
  onUnlinkChildClick,
}: ParentChildrenTabProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const children = parent.children || [];

  return (
    <View style={styles.container}>
      {/* White Main Card Container */}
      <View style={[styles.mainCard, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Ionicons name="people-outline" size={18} color="#059669" style={{ marginRight: 8 }} />
            <ThemedText style={[styles.titleText, { color: colors.text }]}>
              All Linked Children ({children.length})
            </ThemedText>
          </View>

          {canEdit && onLinkChildClick && (
            <TouchableOpacity
              style={[styles.linkChildBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
              onPress={onLinkChildClick}
              activeOpacity={0.7}
            >
              <Ionicons name="link-outline" size={15} color="#059669" style={{ marginRight: 4 }} />
              <ThemedText style={styles.linkChildBtnText}>Link Child</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {children.length > 0 ? (
          <View style={styles.childrenList}>
            {children.map((child, index) => {
              const genderDisplay = child.gender ? (child.gender.charAt(0).toUpperCase() + child.gender.slice(1)) : 'Male';
              const isFemale = child.gender?.toLowerCase() === 'female';

              return (
                <View 
                  key={child.id || index}
                  style={[
                    styles.childCard, 
                    { 
                      backgroundColor: activeTheme === 'dark' ? '#1F2937' : '#F8FAFC',
                      borderColor: colors.border || '#E2E8F0',
                    }
                  ]}
                >
                  {/* Top Row: Avatar + Name/Class + Unlink Button */}
                  <View style={styles.childTopRow}>
                    <View style={styles.childLeftInfo}>
                      {/* Avatar with Emoji */}
                      <View style={[styles.avatarCircle, { backgroundColor: '#CCFBF1' }]}>
                        <ThemedText style={styles.avatarEmoji}>
                          {isFemale ? '👧' : '👦'}
                        </ThemedText>
                      </View>

                      {/* Name and Class */}
                      <View style={styles.nameClassStack}>
                        <ThemedText style={[styles.childName, { color: colors.text }]} numberOfLines={1}>
                          {child.name}
                        </ThemedText>
                        <ThemedText style={[styles.childClass, { color: colors.textSecondary }]}>
                          {child.className || 'Class Unassigned'}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Unlink Action Icon */}
                    {canEdit && onUnlinkChildClick && (
                      <TouchableOpacity
                        onPress={() => onUnlinkChildClick(child)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.unlinkIconBtn}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="link-outline" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Divider */}
                  <View style={[styles.childDivider, { borderBottomColor: activeTheme === 'dark' ? '#374151' : '#EDF2F7' }]} />

                  {/* Bottom Row: 2 Columns (ROLL NO and GENDER) */}
                  <View style={styles.childBottomRow}>
                    <View style={styles.colItem}>
                      <ThemedText style={[styles.colLabel, { color: colors.textSecondary }]}>
                        ROLL NO
                      </ThemedText>
                      <ThemedText style={[styles.colValue, { color: colors.text }]}>
                        {child.rollNumber || '—'}
                      </ThemedText>
                    </View>

                    <View style={styles.colItem}>
                      <ThemedText style={[styles.colLabel, { color: colors.textSecondary }]}>
                        GENDER
                      </ThemedText>
                      <ThemedText style={[styles.colValue, { color: colors.text }]}>
                        {genderDisplay}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="school-outline" size={28} color="#10B981" />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No Children Linked</ThemedText>
            <ThemedText style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Click on &quot;Link Child&quot; to link a student to this parent record.
            </ThemedText>
            {canEdit && onLinkChildClick && (
              <TouchableOpacity
                style={[styles.emptyActionBtn, { backgroundColor: '#10B981' }]}
                onPress={onLinkChildClick}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <ThemedText style={styles.emptyActionBtnText}>Link a Student</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  mainCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkChildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  linkChildBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  childrenList: {
    gap: 12,
  },
  childCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  childTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  childLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  nameClassStack: {
    flex: 1,
    gap: 2,
  },
  childName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  childClass: {
    fontSize: 12,
    fontWeight: '500',
  },
  unlinkIconBtn: {
    padding: 6,
  },
  childDivider: {
    borderBottomWidth: 1,
    marginVertical: 12,
  },
  childBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  colItem: {
    flex: 1,
    gap: 2,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  colValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
    marginBottom: 10,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
