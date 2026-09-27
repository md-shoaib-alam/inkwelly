import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';

export interface ActionItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  destructive?: boolean;
  onPress: () => void;
}

export interface ProfileActionsModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  subtitle?: string;
  actions: ActionItem[];
}

export function ProfileActionsModal({
  visible,
  onDismiss,
  title,
  subtitle = 'Choose an action',
  actions,
}: ProfileActionsModalProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[
          styles.dialog,
          { backgroundColor: colors.backgroundElement }
        ]}
      >
        <Dialog.Title style={[styles.title, { color: colors.text }]}>
          {title}
        </Dialog.Title>
        
        {subtitle ? (
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </ThemedText>
        ) : null}

        <Dialog.Content style={styles.content}>
          {actions.map((action, idx) => {
            const isDestructive = action.destructive;
            const actionColor = action.color || (isDestructive ? '#FF3B30' : '#007AFF');
            const iconBg = isDestructive ? 'rgba(255, 59, 48, 0.12)' : 'rgba(0, 122, 255, 0.1)';

            return (
              <TouchableOpacity
                key={action.id || idx}
                style={[
                  styles.actionRow,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.backgroundSelected,
                  }
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  onDismiss();
                  setTimeout(() => {
                    action.onPress();
                  }, 120);
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                  <Ionicons name={action.icon} size={18} color={actionColor} />
                </View>
                <ThemedText
                  style={[
                    styles.actionLabel,
                    { color: isDestructive ? '#FF3B30' : colors.text }
                  ]}
                >
                  {action.label}
                </ThemedText>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSecondary}
                  style={styles.chevron}
                />
              </TouchableOpacity>
            );
          })}
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button
            mode="outlined"
            textColor={colors.textSecondary}
            style={[styles.cancelBtn, { borderColor: colors.backgroundSelected }]}
            labelStyle={styles.cancelBtnLabel}
            onPress={onDismiss}
          >
            Cancel
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 24,
    maxWidth: 340,
    width: '85%',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 2,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  content: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 6,
    opacity: 0.6,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    justifyContent: 'center',
  },
  cancelBtn: {
    borderRadius: 999,
    flex: 1,
  },
  cancelBtnLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
});
