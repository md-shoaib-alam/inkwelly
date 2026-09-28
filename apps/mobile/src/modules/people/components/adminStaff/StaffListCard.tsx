import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { CardActionMenu } from '@/components/ui/CardActionMenu';
import { StaffMember } from './types';

interface StaffListCardProps {
  item: StaffMember;
  colors: any;
  isAdmin: boolean;
  onPress: (member: StaffMember) => void;
  onEdit: (member: StaffMember) => void;
  onDeleteClick: (member: StaffMember) => void;
  menuVisible: boolean;
  onToggleMenu: (visible: boolean) => void;
}

export const StaffListCard = React.memo(function StaffListCard({
  item,
  colors,
  isAdmin,
  onPress,
  onEdit,
  onDeleteClick,
  menuVisible,
  onToggleMenu,
}: StaffListCardProps) {
  const roleColor = item.customRole?.color || '#007AFF';
  const roleName = item.customRole?.name || 'STAFF';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      style={[
        styles.staffListCard, 
        { 
          backgroundColor: colors.backgroundElement, 
          borderColor: colors.backgroundSelected,
          zIndex: menuVisible ? 100 : 1
        }
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: roleColor }]}>
        <ThemedText style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</ThemedText>
      </View>
      <View style={styles.staffInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ThemedText type="defaultSemiBold" style={[styles.staffName, { color: colors.text }]}>{item.name}</ThemedText>
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#34C759' : '#8E8E93' }]} />
        </View>
        <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{item.email}</ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <View style={[styles.listRoleBadge, { backgroundColor: roleColor + '15' }]}>
            <ThemedText style={[styles.listRoleText, { color: roleColor }]}>{roleName.toUpperCase()}</ThemedText>
          </View>
          {item.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="call-outline" size={12} color={colors.textSecondary} />
              <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                {item.phone}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
      {isAdmin && (
        <CardActionMenu 
          visible={menuVisible}
          onToggle={onToggleMenu}
          onEdit={() => onEdit(item)}
          onDelete={() => onDeleteClick(item)}
        />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  staffListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  listRoleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  menuDropdown: {
    position: 'absolute',
    right: 0,
    top: 36,
    width: 100,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
