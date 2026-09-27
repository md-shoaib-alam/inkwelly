import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { BaseGridCard } from '@/components/ui/BaseGridCard';
import { Parent, Child, getAvatarColor } from './types';

interface ParentCardProps {
  item: Parent;
  colors: any;
  activeTheme: string;
  isTablet: boolean;
  isAdmin: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLinkChild: () => void;
  onUnlinkChild: (child: Child) => void;
  menuVisible: boolean;
  onToggleMenu: (visible: boolean) => void;
}

export function ParentCard({
  item,
  colors,
  activeTheme,
  isTablet,
  isAdmin,
  onPress,
  onEdit,
  onDelete,
  onLinkChild,
  onUnlinkChild,
  menuVisible,
  onToggleMenu,
}: ParentCardProps) {
  const childCount = item.children?.length || 0;
  const avatarBg = getAvatarColor(item.id);

  return (
    <BaseGridCard
      name={item.name}
      avatarText={item.name.slice(0, 2).toUpperCase()}
      avatarBgColor={avatarBg}
      subTitle={item.email}
      subTitleIcon="mail-outline"
      onPress={onPress}
      isAdmin={isAdmin}
      menuVisible={menuVisible}
      onToggleMenu={onToggleMenu}
      onEdit={onEdit}
      onDelete={onDelete}
    >

      {/* Contact/Job info */}
      <View style={styles.contactRow}>
        <View style={styles.infoMeta}>
          <Ionicons name="call-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <ThemedText style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>{item.phone || 'N/A'}</ThemedText>
        </View>
        <View style={styles.infoMeta}>
          <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <ThemedText style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>{item.occupation || 'N/A'}</ThemedText>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { borderBottomColor: colors.backgroundSelected }]} />

      {/* Linked Children */}
      <View style={styles.childrenSection}>
        <View style={styles.childrenSectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="happy-outline" size={16} color={colors.text} style={{ marginRight: 6 }} />
            <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
              Children ({childCount})
            </ThemedText>
          </View>
          
          {isAdmin && (
            <TouchableOpacity
              style={[styles.linkChildInlineBtn, { borderColor: '#10B98180', backgroundColor: '#ECFDF5' }]}
              onPress={onLinkChild}
            >
              <Ionicons name="link" size={12} color="#10B981" style={{ marginRight: 4 }} />
              <ThemedText style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>Link Child</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Children List */}
        {item.children && item.children.length > 0 ? (
          item.children.map((child) => (
            <View 
              key={child.id} 
              style={[
                styles.childBox, 
                { 
                  backgroundColor: activeTheme === 'dark' ? '#27272A' : '#F3F4F6',
                  borderColor: colors.backgroundSelected 
                }
              ]}
            >
              <View style={[styles.childAvatar, { backgroundColor: activeTheme === 'dark' ? '#3F3F46' : '#E0E7FF' }]}>
                <Ionicons name="person-outline" size={14} color="#4F46E5" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 13, color: colors.text }}>{child.name}</ThemedText>
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                  Grade {child.className || 'N/A'} • Roll {child.rollNumber || 'N/A'}
                </ThemedText>
              </View>
              {isAdmin && (
                <TouchableOpacity onPress={() => onUnlinkChild(child)} style={styles.unlinkBtn}>
                  <Ionicons name="unlink" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <ThemedText style={[styles.emptyChildrenText, { color: colors.textSecondary }]}>
            No children linked yet.
          </ThemedText>
        )}
      </View>
    </BaseGridCard>
  );
}

const styles = StyleSheet.create({
  parentCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  parentMainInfo: {
    marginLeft: 10,
    flex: 1,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '800',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  emailText: {
    fontSize: 12,
  },
  actionRow: {
    position: 'absolute',
    right: 0,
    top: 5,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  infoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 12,
  },
  childrenSection: {
    gap: 8,
  },
  childrenSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkChildInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  childBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  childAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlinkBtn: {
    padding: 4,
  },
  emptyChildrenText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  menuDropdown: {
    position: 'absolute',
    right: 0,
    top: 32,
    borderWidth: 1,
    borderRadius: 8,
    width: 100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
