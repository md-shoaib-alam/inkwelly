import React from 'react';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { CertificateRecord } from './types';

interface RevokeCertificateDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  certificate: CertificateRecord | null;
  isSubmitting: boolean;
  onRevoke: () => void;
}

export function RevokeCertificateDialog({
  visible,
  onDismiss,
  colors,
  certificate,
  isSubmitting,
  onRevoke,
}: RevokeCertificateDialogProps) {
  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={() => !isSubmitting && onDismiss()}
        style={{ backgroundColor: colors.backgroundElement }}
      >
        <Dialog.Title style={{ color: '#EF4444' }}>Revoke Certificate</Dialog.Title>
        <Dialog.Content>
          <ThemedText style={{ color: colors.text }}>
            Are you sure you want to permanently revoke certificate <ThemedText style={{ fontWeight: 'bold' }}>{certificate?.certificateNo}</ThemedText>? This cannot be undone.
          </ThemedText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} disabled={isSubmitting} onPress={onDismiss}>Cancel</Button>
          <Button 
            textColor="#FFF" 
            buttonColor="#EF4444" 
            loading={isSubmitting} 
            disabled={isSubmitting}
            onPress={onRevoke}
          >
            Confirm Revoke
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
