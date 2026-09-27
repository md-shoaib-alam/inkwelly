import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Teacher, getAvatarColor } from './types';

interface TeacherCardProps {
  item: Teacher;
  colors: any;
  activeTheme: string;
  isTablet: boolean;
  isAdmin: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  menuVisible?: boolean;
  onToggleMenu?: (visible: boolean) => void;
}

export function TeacherCard({
  item,
  colors,
  activeTheme,
  isTablet,
  isAdmin,
  onPress,
  onEdit,
  onDelete,
}: TeacherCardProps) {
  const avatarBg = getAvatarColor(item.id);
  const initials = item.name
    ? item.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'TC';

  const isDark = activeTheme === 'dark';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: isDark ? '#27272A' : '#E2E8F0',
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <ThemedText style={styles.avatarText}>{initials}</ThemedText>
        </View>

        {/* Info */}
        <View style={styles.headerInfo}>
          <ThemedText
            type="defaultSemiBold"
            numberOfLines={1}
            style={[styles.teacherName, { color: colors.text }]}
          >
            {item.name}
          </ThemedText>

          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={13} color={colors.textSecondary} style={{ marginRight: 5 }} />
            <ThemedText numberOfLines={1} style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.email}
            </ThemedText>
          </View>

          {!!item.phone && (
            <View style={styles.phoneRow}>
              <ThemedText numberOfLines={1} style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.phone}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Action Buttons matching school-web */}
        {isAdmin && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={onEdit}
              style={[styles.iconBtn, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="pencil-outline" size={15} color={isDark ? '#34D399' : '#059669'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDelete}
              style={[styles.iconBtn, { backgroundColor: isDark ? '#27272A' : '#FEF2F2' }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Middle: Subjects & Classes */}
      <View style={styles.middleSection}>
        {/* Subjects */}
        {item.subjects && item.subjects.length > 0 && (
          <View style={styles.detailItemRow}>
            <Ionicons name="book-outline" size={15} color={colors.textSecondary} style={styles.itemLeadingIcon} />
            <View style={styles.badgesWrapper}>
              {item.subjects.map((sub, idx) => (
                <View
                  key={`${sub}-${idx}`}
                  style={[
                    styles.emeraldBadge,
                    {
                      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5',
                      borderColor: isDark ? '#065F46' : '#A7F3D0',
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.emeraldBadgeText,
                      { color: isDark ? '#34D399' : '#047857' },
                    ]}
                    numberOfLines={1}
                  >
                    {sub}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Classes */}
        {item.classes && item.classes.length > 0 && (
          <View style={styles.detailItemRow}>
            <Ionicons name="school-outline" size={15} color={colors.textSecondary} style={styles.itemLeadingIcon} />
            <View style={styles.badgesWrapper}>
              {item.classes.map((cls, idx) => (
                <View
                  key={`${cls}-${idx}`}
                  style={[
                    styles.outlineBadge,
                    {
                      borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                      backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.outlineBadgeText,
                      { color: isDark ? '#E4E4E7' : '#334155' },
                    ]}
                    numberOfLines={1}
                  >
                    {cls}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Footer: Experience & Qualification */}
      {(!!item.experience || !!item.qualification) && (
        <View style={[styles.cardFooter, { borderTopColor: isDark ? '#27272A' : '#F1F5F9' }]}>
          {!!item.experience && (
            <View style={styles.footerMetaItem}>
              <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
              <ThemedText style={[styles.footerMetaText, { color: colors.textSecondary }]}>
                {item.experience} exp
              </ThemedText>
            </View>
          )}

          {!!item.qualification && (
            <View style={styles.footerMetaItem}>
              <Ionicons name="ribbon-outline" size={14} color={colors.textSecondary} />
              <ThemedText style={[styles.footerMetaText, { color: colors.textSecondary }]}>
                {item.qualification}
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  teacherName: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  phoneRow: {
    marginTop: 2,
  },
  metaText: {
    fontSize: 12.5,
    fontWeight: '400',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleSection: {
    marginTop: 14,
    gap: 8,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemLeadingIcon: {
    marginTop: 2,
  },
  badgesWrapper: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emeraldBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  emeraldBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  outlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  outlineBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
