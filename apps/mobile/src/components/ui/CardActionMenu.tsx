import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

interface CardActionMenuProps {
  visible: boolean;
  onToggle: (visible: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  buttonStyle?: any;
}

export function CardActionMenu({ visible, onToggle, onEdit, onDelete, buttonStyle }: CardActionMenuProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <View style={[styles.container, { zIndex: 999 }]}>
      <TouchableOpacity 
        onPress={() => onToggle(!visible)} 
        style={[
          styles.actionBtn, 
          { 
            padding: 6, 
            borderRadius: 16, 
            backgroundColor: activeTheme === 'dark' ? '#27272A' : '#F3F4F6' 
          },
          buttonStyle
        ]}
      >
        <Ionicons name="ellipsis-vertical" size={16} color={colors.text} />
      </TouchableOpacity>

      {visible && (
        <View style={[
          styles.menuDropdown, 
          { 
            backgroundColor: colors.backgroundElement, 
            borderColor: colors.backgroundSelected,
            shadowColor: '#000',
          }
        ]}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              onToggle(false);
              onEdit();
            }}
          >
            <Ionicons name="pencil-outline" size={14} color="#007AFF" />
            <ThemedText style={[styles.menuItemText, { color: colors.text }]}>Edit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.backgroundSelected }]} 
            onPress={() => {
              onToggle(false);
              onDelete();
            }}
          >
            <Ionicons name="trash-outline" size={14} color="#FF3B30" />
            <ThemedText style={[styles.menuItemText, { color: colors.text }]}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
