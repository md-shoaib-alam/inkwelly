import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Portal, Dialog } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export function CustomAlertDialog({
  visible,
  onDismiss,
  colors,
  title,
  message,
  type,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm
}: CustomAlertDialogProps) {
  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={{ backgroundColor: colors.backgroundElement, borderRadius: 20, padding: 10, alignSelf: 'center', width: '85%', maxWidth: 350 }}
      >
        <Dialog.Content style={{ alignItems: 'center', gap: 12, paddingBottom: 6 }}>
          {type === 'success' && (
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(52, 199, 89, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="checkmark-circle" size={36} color="#34C759" />
            </View>
          )}
          {type === 'error' && (
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 59, 48, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="alert-circle" size={36} color="#FF3B30" />
            </View>
          )}
          {type === 'warning' && (
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 149, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="warning" size={32} color="#FF9500" />
            </View>
          )}
          {type === 'confirm' && (
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0, 122, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="help-circle" size={36} color="#007AFF" />
            </View>
          )}
          {type === 'info' && (
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(142, 142, 147, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="information-circle" size={36} color="#8E8E93" />
            </View>
          )}

          <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center' }}>
            {title}
          </ThemedText>

          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
            {message}
          </ThemedText>
        </Dialog.Content>
        <Dialog.Actions style={{ justifyContent: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10 }}>
          {(type === 'confirm' || cancelText !== 'Cancel') && (
            <TouchableOpacity
              style={{ flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.backgroundSelected, justifyContent: 'center', alignItems: 'center' }}
              onPress={onDismiss}
            >
              <ThemedText style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 13 }}>
                {cancelText}
              </ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{
              flex: 1,
              height: 40,
              borderRadius: 10,
              backgroundColor: type === 'error' ? '#FF3B30' : type === 'warning' ? '#FF9500' : '#007AFF',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => {
              onDismiss();
              if (onConfirm) onConfirm();
            }}
          >
            <ThemedText style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>
              {confirmText}
            </ThemedText>
          </TouchableOpacity>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
