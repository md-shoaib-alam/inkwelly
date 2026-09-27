import React from 'react';
import { StyleSheet, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { CardActionMenu } from './CardActionMenu';

interface BaseGridCardProps {
  name: string;
  avatarText: string;
  avatarBgColor: string;
  subTitle?: string;
  subTitleIcon?: string;
  onPress: () => void;
  isAdmin: boolean;
  menuVisible: boolean;
  onToggleMenu: (visible: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}

export function BaseGridCard({
  name,
  avatarText,
  avatarBgColor,
  subTitle,
  subTitleIcon,
  onPress,
  isAdmin,
  menuVisible,
  onToggleMenu,
  onEdit,
  onDelete,
  children,
}: BaseGridCardProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();
  const isTablet = width >= 650;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card, 
        { 
          backgroundColor: colors.backgroundElement, 
          borderColor: colors.backgroundSelected,
          width: isTablet ? '48.5%' : '100%',
          zIndex: menuVisible ? 100 : 1
        }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.avatar, { backgroundColor: avatarBgColor }]}>
            <ThemedText style={styles.avatarText}>{avatarText}</ThemedText>
          </View>
          <View style={[styles.mainInfo, { marginRight: isAdmin ? 36 : 0 }]}>
            <ThemedText type="defaultSemiBold" numberOfLines={1} style={[styles.nameText, { color: colors.text }]}>
              {name}
            </ThemedText>
            {subTitle && (
              <View style={styles.subTitleRow}>
                {subTitleIcon && (
                  <Ionicons name={subTitleIcon as any} size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                )}
                <ThemedText numberOfLines={1} style={[styles.subTitleText, { color: colors.textSecondary }]}>
                  {subTitle}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
        
        {isAdmin && (
          <CardActionMenu 
            visible={menuVisible}
            onToggle={onToggleMenu}
            onEdit={onEdit}
            onDelete={onDelete}
            buttonStyle={styles.actionBtnCircle}
          />
        )}
      </View>

      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  mainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameText: {
    fontSize: 16,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subTitleText: {
    fontSize: 12,
    flex: 1,
  },
  actionBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
