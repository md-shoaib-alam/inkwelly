import React from 'react';
import { StyleSheet, Modal, View } from 'react-native';
import { Parent, Child } from './types';
import { ParentProfileView } from './profile';

interface ParentDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  activeTheme: string;
  selectedParent: Parent | null;
  isAdmin: boolean;
  onLinkChildClick: () => void;
  onUnlinkChildClick: (child: Child) => void;
}

export function ParentDetailModal({
  visible,
  onDismiss,
  selectedParent,
  isAdmin,
  onLinkChildClick,
  onUnlinkChildClick,
}: ParentDetailModalProps) {
  if (!visible || !selectedParent) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        <ParentProfileView
          parent={selectedParent}
          onBack={onDismiss}
          canEdit={isAdmin}
          canDelete={isAdmin}
          onLinkChildClick={() => {
            onDismiss();
            onLinkChildClick();
          }}
          onUnlinkChildClick={(child) => {
            onDismiss();
            onUnlinkChildClick(child);
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
