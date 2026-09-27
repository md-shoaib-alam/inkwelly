import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Dialog, Portal, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { LeaveRequest } from './types';

interface LeaveActionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  dialogAction: 'approve' | 'reject';
  selectedLeave: LeaveRequest | null;
  isSubmitting: boolean;
  colors: any;
  onConfirm: (remarks: string) => void;
}

export function LeaveActionDialog({
  visible,
  onDismiss,
  dialogAction,
  selectedLeave,
  isSubmitting,
  colors,
  onConfirm,
}: LeaveActionDialogProps) {
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (visible) {
      setRemarks('');
    }
  }, [visible]);

  const handleConfirmClick = () => {
    onConfirm(remarks);
  };

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.backgroundElement }}
      >
        <Dialog.Title style={{ color: colors.text }}>
          {dialogAction === 'approve' ? 'Approve Application' : 'Reject Application'}
        </Dialog.Title>
        <Dialog.Content>
          <ThemedText style={{ color: colors.text, fontSize: 14, marginBottom: 16 }}>
            You are about to {dialogAction} the leave request for <ThemedText style={{ fontWeight: 'bold' }}>{selectedLeave?.userName}</ThemedText>.
          </ThemedText>
          <TextInput
            placeholder="Add optional remarks or reasons..."
            placeholderTextColor={colors.textSecondary}
            value={remarks}
            onChangeText={setRemarks}
            style={[styles.remarksInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
            multiline
            numberOfLines={3}
          />
        </Dialog.Content>
        <Dialog.Actions style={{ gap: 8 }}>
          <Button textColor={colors.textSecondary} onPress={onDismiss}>Cancel</Button>
          <Button 
            buttonColor={dialogAction === 'approve' ? '#34C759' : '#FF3B30'} 
            textColor="#FFFFFF" 
            disabled={isSubmitting}
            onPress={handleConfirmClick}
            style={{ borderRadius: 12 }}
          >
            {isSubmitting ? 'Processing...' : dialogAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  remarksInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
