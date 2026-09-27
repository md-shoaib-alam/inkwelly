import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import type { Student } from '@/types';
import { StudentProfileView } from './profile';

interface StudentDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  student: Student | null;
  onEdit?: (student: Student) => void;
  onToggleStatus?: (student: Student) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

/**
 * StudentDetailModal — lightweight modal adapter delegating to modular StudentProfileView.
 */
export function StudentDetailModal({
  visible,
  onDismiss,
  student,
  onEdit,
  onToggleStatus,
  canEdit = true,
  canDelete = true,
}: StudentDetailModalProps) {
  if (!visible || !student) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <ThemedView style={styles.container} safeAreaTop>
        <StudentProfileView
          student={student}
          onBack={onDismiss}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
