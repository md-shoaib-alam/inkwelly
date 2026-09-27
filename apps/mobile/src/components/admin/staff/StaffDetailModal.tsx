import React from 'react';
import { StyleSheet, Modal, View } from 'react-native';
import { StaffMember } from './types';
import { StaffProfileView } from './profile';

interface StaffDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  selectedStaff: StaffMember | null;
  colors: any;
  activeTheme: string;
}

export function StaffDetailModal({
  visible,
  onDismiss,
  selectedStaff,
}: StaffDetailModalProps) {
  if (!visible || !selectedStaff) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        <StaffProfileView
          member={selectedStaff}
          onBack={onDismiss}
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
