import React from 'react';
import { StyleSheet, Modal, View } from 'react-native';
import { Teacher } from './types';
import { TeacherProfileView } from './profile/index';

interface TeacherDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  activeTheme: string;
  selectedTeacher: Teacher | null;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function TeacherDetailModal({
  visible,
  onDismiss,
  selectedTeacher,
  isAdmin,
  onEdit,
  onDelete,
}: TeacherDetailModalProps) {
  if (!visible || !selectedTeacher) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        <TeacherProfileView
          teacher={selectedTeacher}
          onBack={onDismiss}
          canEdit={isAdmin}
          canDelete={isAdmin}
          onEdit={() => {
            onDismiss();
            onEdit();
          }}
          onDelete={() => {
            onDismiss();
            onDelete();
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
