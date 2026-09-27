import React from 'react';
import { View } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';

export interface AlertConfig {
  visible: boolean;
  title: string;
  message: string;
  showCancel?: boolean;
  confirmText?: string;
  confirmColor?: string;
  onConfirm?: () => void;
  onDismiss?: () => void;
}

export function CustomAlert({
  visible,
  title,
  message,
  showCancel,
  confirmText = 'OK',
  confirmColor,
  onConfirm,
  onDismiss,
}: AlertConfig) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.backgroundElement, maxWidth: 320, width: '80%', alignSelf: 'center', borderRadius: 16 }}
      >
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
          <View style={{ 
            width: 56, height: 56, borderRadius: 28, 
            backgroundColor: title === 'Error' ? '#FF3B3015' : title === 'Success' ? '#34C75915' : colors.backgroundSelected, 
            justifyContent: 'center', alignItems: 'center', marginBottom: 16 
          }}>
            <Ionicons 
              name={title === 'Error' ? 'close-circle' : title === 'Success' ? 'checkmark-circle' : 'alert-circle-outline'} 
              size={32} 
              color={title === 'Error' ? '#FF3B30' : title === 'Success' ? '#34C759' : colors.text} 
            />
          </View>
          <Dialog.Title style={{ color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginVertical: 0, paddingHorizontal: 16 }}>
            {title}
          </Dialog.Title>
        </View>
        <Dialog.Content>
          <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
            {message}
          </ThemedText>
        </Dialog.Content>
        <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', gap: 12 }}>
          {showCancel && (
            <Button
              mode="outlined"
              textColor={colors.text}
              style={{ borderRadius: 20, flex: 1, borderColor: colors.backgroundSelected }}
              onPress={onDismiss}
            >
              Cancel
            </Button>
          )}
          <Button
            mode="contained"
            buttonColor={confirmColor || colors.text}
            textColor={confirmColor ? '#FFF' : colors.background}
            style={{ borderRadius: 20, flex: 1 }}
            onPress={() => {
              if (onDismiss) onDismiss();
              if (onConfirm) onConfirm();
            }}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
