import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { BaseGridCard } from '@/components/ui/BaseGridCard';
import type { Staff } from '@/types';


interface StaffCardProps {
  member: Staff;
  onEdit: (member: Staff) => void;
  onDelete: (member: Staff) => void;
  onPress: (member: Staff) => void;
  isAdmin: boolean;
  menuVisible: boolean;
  onToggleMenu: (visible: boolean) => void;
}

export function StaffCard({ member, onEdit, onDelete, onPress, isAdmin, menuVisible, onToggleMenu }: StaffCardProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const roleColor = member.customRole?.color || '#007AFF';
  const roleName = member.customRole?.name || 'STAFF';

  return (
    <BaseGridCard
      name={member.name}
      avatarText={member.name.charAt(0)}
      avatarBgColor={roleColor}
      subTitle={member.email}
      subTitleIcon="mail-outline"
      onPress={() => onPress(member)}
      isAdmin={isAdmin}
      menuVisible={menuVisible}
      onToggleMenu={onToggleMenu}
      onEdit={() => onEdit(member)}
      onDelete={() => onDelete(member)}
    >
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: member.isActive ? '#34C759' : '#8E8E93' }]} />
        <ThemedText style={[styles.statusText, { color: colors.textSecondary }]}>
          {member.isActive ? 'Active' : 'Inactive'}
        </ThemedText>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="mail-outline" size={12} color={colors.textSecondary} style={styles.icon} />
        <ThemedText style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>{member.email}</ThemedText>
      </View>
      
      {member.phone ? (
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={12} color={colors.textSecondary} style={styles.icon} />
          <ThemedText style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>{member.phone}</ThemedText>
        </View>
      ) : (
        <View style={{ height: 18 }} /> // spacer to maintain height
      )}

      <View style={[styles.roleBadge, { backgroundColor: roleColor + '15' }]}>
        <ThemedText style={[styles.roleText, { color: roleColor }]}>{roleName.toUpperCase()}</ThemedText>
      </View>
    </BaseGridCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 4,
    marginLeft: 4,
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
  name: {
    fontSize: 15,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
    width: 12,
  },
  infoText: {
    fontSize: 11,
    flex: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
