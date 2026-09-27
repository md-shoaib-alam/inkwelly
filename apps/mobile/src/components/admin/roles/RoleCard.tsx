import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Menu } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { RoleRecord, StaffMember, PERMISSION_MODULES } from './types';

interface RoleCardProps {
  item: RoleRecord;
  assignedCount: number;
  isAdmin: boolean;
  numColumns: number;
  colors: any;
  activeTheme: string;
  onOpenAssign: (role: RoleRecord) => void;
  onOpenEdit: (role: RoleRecord) => void;
  onDeleteClick: (role: RoleRecord) => void;
}

export const RoleCard = React.memo(function RoleCard({
  item,
  assignedCount,
  isAdmin,
  numColumns,
  colors,
  activeTheme,
  onOpenAssign,
  onOpenEdit,
  onDeleteClick,
}: RoleCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  let perms: Record<string, string[]> = {};
  if (typeof item.permissions === 'string') {
    try {
      perms = JSON.parse(item.permissions || '{}');
    } catch (e) {
      perms = {};
    }
  } else {
    perms = item.permissions || {};
  }
  const permCount = Object.values(perms).flat().length;

  const getActionColors = (action: string) => {
    const act = action.toLowerCase();
    if (act === 'view') return { bg: activeTheme === 'dark' ? '#27272a' : '#f4f4f5', text: activeTheme === 'dark' ? '#d4d4d8' : '#3f3f46' };
    if (act === 'create') return { bg: activeTheme === 'dark' ? '#064e3b' : '#d1fae5', text: activeTheme === 'dark' ? '#6ee7b7' : '#065f46' };
    if (act === 'edit') return { bg: activeTheme === 'dark' ? '#78350f' : '#fef3c7', text: activeTheme === 'dark' ? '#fde047' : '#92400E' };
    if (act === 'delete') return { bg: activeTheme === 'dark' ? '#7f1d1d' : '#fee2e2', text: activeTheme === 'dark' ? '#fca5a5' : '#991b1b' };
    return { bg: '#f4f4f5', text: '#3f3f46' };
  };

  return (
    <View 
      style={[
        styles.roleCard, 
        { 
          backgroundColor: colors.backgroundElement, 
          borderColor: colors.backgroundSelected,
          flex: numColumns > 1 ? 1 : undefined,
          maxWidth: numColumns > 1 ? '48%' : '100%',
          margin: numColumns > 1 ? 6 : 0,
          marginBottom: 16
        }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <View style={[styles.avatarBox, { backgroundColor: item.color || '#6366f1' }]}>
            <ThemedText style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</ThemedText>
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ color: colors.text, fontSize: 16 }}>{item.name}</ThemedText>
            {item.description && (
              <ThemedText numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{item.description}</ThemedText>
            )}
          </View>
        </View>
        
        {isAdmin && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.moreBtn}>
                <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            }
            contentStyle={{ backgroundColor: colors.backgroundElement }}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                onOpenAssign(item);
              }}
              title="Assign Staff"
              titleStyle={{ color: colors.text, fontSize: 14 }}
              leadingIcon={props => <Ionicons name="person-add-outline" {...props} size={18} color="#007AFF" />}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                onOpenEdit(item);
              }}
              title="Edit Role"
              titleStyle={{ color: colors.text, fontSize: 14 }}
              leadingIcon={props => <Ionicons name="create" {...props} size={18} color="#34C759" />}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                onDeleteClick(item);
              }}
              title="Delete"
              titleStyle={{ color: '#FF3B30', fontSize: 14 }}
              leadingIcon={props => <Ionicons name="trash-outline" {...props} size={18} color="#FF3B30" />}
            />
          </Menu>
        )}
      </View>

      <View style={styles.badgesRow}>
        <View style={[styles.badgeItem, { backgroundColor: '#007AFF10' }]}>
          <Ionicons name="people-outline" size={12} color="#007AFF" />
          <ThemedText style={[styles.badgeText, { color: '#007AFF' }]}>{assignedCount} staff</ThemedText>
        </View>
        
        <View style={[styles.badgeItem, { backgroundColor: '#6366F110' }]}>
          <Ionicons name="shield-checkmark-outline" size={12} color="#6366f1" />
          <ThemedText style={[styles.badgeText, { color: '#6366f1' }]}>{permCount} permissions</ThemedText>
        </View>
      </View>

      {permCount > 0 && (
        <View style={styles.modulesContainer}>
          {Object.entries(perms).map(([mod, actions]) => {
            if (!Array.isArray(actions) || actions.length === 0) return null;
            const moduleLabel = PERMISSION_MODULES.find((m) => m.key === mod)?.label || mod;
            
            return (
              <View key={mod} style={[styles.modulePermBlock, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                <ThemedText style={[styles.modulePermLabel, { color: colors.text }]}>{moduleLabel}</ThemedText>
                <View style={styles.actionTagsList}>
                  {actions.map((act) => {
                    const actColors = getActionColors(act);
                    return (
                      <View key={act} style={[styles.actionTag, { backgroundColor: actColors.bg }]}>
                        <ThemedText style={[styles.actionTagText, { color: actColors.text }]}>{act.toUpperCase()}</ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  roleCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modulesContainer: {
    marginTop: 8,
    gap: 6,
  },
  modulePermBlock: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modulePermLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  actionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
