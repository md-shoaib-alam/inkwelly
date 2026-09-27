import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Portal, Dialog } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ClassOption, StudentOption, PromotionFormData } from './types';

// Individual New Promotion Modal
interface NewPromotionModalProps {
  visible: boolean;
  onDismiss: () => void;
  form: PromotionFormData;
  setForm: React.Dispatch<React.SetStateAction<PromotionFormData>>;
  classes: ClassOption[];
  students: StudentOption[];
  onOpenClassPicker: (type: 'from' | 'to') => void;
  onOpenStudentPicker: () => void;
  onSubmit: () => void;
  submitting: boolean;
  colors: any;
}

export const NewPromotionModal: React.FC<NewPromotionModalProps> = ({
  visible,
  onDismiss,
  form,
  setForm,
  classes,
  students,
  onOpenClassPicker,
  onOpenStudentPicker,
  onSubmit,
  submitting,
  colors,
}) => {
  const fromClass = classes.find(c => c.id === form.fromClassId);
  const toClass = classes.find(c => c.id === form.toClassId);
  const student = students.find(s => s.id === form.studentId);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
        <View style={styles.dialogHeader}>
          <Dialog.Title style={{ color: colors.text, margin: 0, fontSize: 18 }}>New Student Promotion</Dialog.Title>
          <TouchableOpacity onPress={onDismiss} style={{ padding: 4 }}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Dialog.Content>
          <ScrollView style={{ maxHeight: 400 }}>
            {/* From Class */}
            <ThemedText style={styles.label}>From Class *</ThemedText>
            <TouchableOpacity
              style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
              onPress={() => onOpenClassPicker('from')}
            >
              <ThemedText style={{ color: fromClass ? colors.text : colors.textSecondary, fontSize: 13 }}>
                {fromClass ? `${fromClass.name}-${fromClass.section}` : 'Select current class'}
              </ThemedText>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Student */}
            <ThemedText style={[styles.label, { marginTop: 12 }]}>Student *</ThemedText>
            <TouchableOpacity
              style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
              onPress={onOpenStudentPicker}
              disabled={!form.fromClassId}
            >
              <ThemedText style={{ color: student ? colors.text : colors.textSecondary, fontSize: 13 }}>
                {student ? `${student.name} (${student.rollNumber || 'No Roll'})` : form.fromClassId ? 'Select student' : 'Select class first'}
              </ThemedText>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* To Class */}
            <ThemedText style={[styles.label, { marginTop: 12 }]}>To Class (Target) *</ThemedText>
            <TouchableOpacity
              style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
              onPress={() => onOpenClassPicker('to')}
            >
              <ThemedText style={{ color: toClass ? colors.text : colors.textSecondary, fontSize: 13 }}>
                {toClass ? `${toClass.name}-${toClass.section}` : 'Auto-detected or select class'}
              </ThemedText>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Academic Year */}
            <ThemedText style={[styles.label, { marginTop: 12 }]}>Academic Year *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              value={form.academicYear}
              onChangeText={(text) => setForm(prev => ({ ...prev, academicYear: text }))}
              placeholder="e.g. 2024-2025"
              placeholderTextColor={colors.textSecondary}
            />

            {/* Remarks */}
            <ThemedText style={[styles.label, { marginTop: 12 }]}>Remarks (Optional)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, height: 60 }]}
              value={form.remarks}
              onChangeText={(text) => setForm(prev => ({ ...prev, remarks: text }))}
              placeholder="Notes or reason..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions style={styles.dialogActions}>
          <TouchableOpacity
            style={[styles.capsuleBtn, { backgroundColor: colors.backgroundSelected }]}
            onPress={onDismiss}
          >
            <ThemedText style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.capsuleBtn, { backgroundColor: '#007AFF', opacity: (!form.studentId || !form.toClassId || submitting) ? 0.5 : 1 }]}
            onPress={onSubmit}
            disabled={!form.studentId || !form.toClassId || submitting}
          >
            <ThemedText style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>
              {submitting ? 'Submitting...' : 'Create Request'}
            </ThemedText>
          </TouchableOpacity>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// Reject Promotion Dialog Modal
interface RejectPromotionModalProps {
  visible: boolean;
  onDismiss: () => void;
  studentName?: string;
  remarks: string;
  setRemarks: (text: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  colors: any;
}

export const RejectPromotionModal: React.FC<RejectPromotionModalProps> = ({
  visible,
  onDismiss,
  studentName,
  remarks,
  setRemarks,
  onSubmit,
  submitting,
  colors,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
        <Dialog.Title style={{ color: colors.text, fontSize: 16 }}>Reject Promotion Request</Dialog.Title>
        <Dialog.Content>
          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
            Are you sure you want to reject the promotion for <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{studentName || 'this student'}</ThemedText>?
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, height: 70 }]}
            placeholder="Reason for rejection (Optional)"
            placeholderTextColor={colors.textSecondary}
            value={remarks}
            onChangeText={setRemarks}
            multiline
          />
        </Dialog.Content>
        <Dialog.Actions style={styles.dialogActions}>
          <TouchableOpacity
            style={[styles.capsuleBtn, { backgroundColor: colors.backgroundSelected }]}
            onPress={onDismiss}
          >
            <ThemedText style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.capsuleBtn, { backgroundColor: '#FF3B30', opacity: submitting ? 0.5 : 1 }]}
            onPress={onSubmit}
            disabled={submitting}
          >
            <ThemedText style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>
              {submitting ? 'Rejecting...' : 'Reject Request'}
            </ThemedText>
          </TouchableOpacity>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  pickerTrigger: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  capsuleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
