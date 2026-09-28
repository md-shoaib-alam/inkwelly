import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface ClassInfo {
  id: string;
  name: string;
  section: string;
}

interface TeacherInfo {
  id: string;
  name: string;
}

interface SubjectDialogsProps {
  colors: any;
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  form: any;
  setForm: (v: any) => void;
  classes: ClassInfo[];
  teachers: TeacherInfo[];
  onCreate: () => void;
  creating: boolean;

  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editForm: any;
  setEditForm: (v: any) => void;
  onEdit: () => void;
  updating: boolean;
}

export function SubjectDialogs({
  colors,
  createOpen,
  setCreateOpen,
  form,
  setForm,
  classes,
  teachers,
  onCreate,
  creating,
  editOpen,
  setEditOpen,
  editForm,
  setEditForm,
  onEdit,
  updating,
}: SubjectDialogsProps) {
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [teacherPickerVisible, setTeacherPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'create' | 'edit'>('create');

  const selectedCreateClass = classes.find(c => c.id === form.classId);
  const selectedEditClass = classes.find(c => c.id === editForm.classId);

  const selectedCreateTeacher = teachers.find(t => t.id === form.teacherId);
  const selectedEditTeacher = teachers.find(t => t.id === editForm.teacherId);

  const openClassPicker = (target: 'create' | 'edit') => {
    setPickerTarget(target);
    setClassPickerVisible(true);
  };

  const openTeacherPicker = (target: 'create' | 'edit') => {
    setPickerTarget(target);
    setTeacherPickerVisible(true);
  };

  const handleClassSelect = (classId: string) => {
    if (pickerTarget === 'create') {
      setForm({ ...form, classId });
    } else {
      setEditForm({ ...editForm, classId });
    }
    setClassPickerVisible(false);
  };

  const handleTeacherSelect = (teacherId: string) => {
    if (pickerTarget === 'create') {
      setForm({ ...form, teacherId });
    } else {
      setEditForm({ ...editForm, teacherId });
    }
    setTeacherPickerVisible(false);
  };

  const renderFormFields = (values: any, setValues: any, mode: 'create' | 'edit') => {
    const isCreate = mode === 'create';
    const chosenClass = isCreate ? selectedCreateClass : selectedEditClass;
    const chosenTeacher = isCreate ? selectedCreateTeacher : selectedEditTeacher;

    return (
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Subject Name *</ThemedText>
          <TextInput
            placeholder="e.g. Mathematics"
            placeholderTextColor={colors.textSecondary}
            value={values.name}
            onChangeText={(text) => setValues({ ...values, name: text })}
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Subject Code *</ThemedText>
          <TextInput
            placeholder="e.g. MATH-101"
            placeholderTextColor={colors.textSecondary}
            value={values.code}
            onChangeText={(text) => setValues({ ...values, code: text })}
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Class *</ThemedText>
          <TouchableOpacity
            style={[styles.selectorTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
            onPress={() => openClassPicker(mode)}
          >
            <ThemedText style={{ color: chosenClass ? colors.text : colors.textSecondary }}>
              {chosenClass ? `${chosenClass.name} - ${chosenClass.section}` : 'Select class'}
            </ThemedText>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Teacher (optional)</ThemedText>
          <TouchableOpacity
            style={[styles.selectorTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
            onPress={() => openTeacherPicker(mode)}
          >
            <ThemedText style={{ color: chosenTeacher ? colors.text : colors.textSecondary }}>
              {chosenTeacher ? chosenTeacher.name : 'None (Unassigned)'}
            </ThemedText>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Portal>
      {/* Create Subject Dialog */}
      <Dialog
        visible={createOpen}
        onDismiss={() => setCreateOpen(false)}
        style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
      >
        <Dialog.Title style={{ color: colors.text }}>Add New Subject</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            {renderFormFields(form, setForm, 'create')}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={() => setCreateOpen(false)}>Cancel</Button>
          <Button textColor="#007AFF" disabled={creating} onPress={onCreate}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog
        visible={editOpen}
        onDismiss={() => setEditOpen(false)}
        style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
      >
        <Dialog.Title style={{ color: colors.text }}>Edit Subject</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            {renderFormFields(editForm, setEditForm, 'edit')}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={() => setEditOpen(false)}>Cancel</Button>
          <Button textColor="#007AFF" disabled={updating} onPress={onEdit}>
            {updating ? 'Saving...' : 'Save'}
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Class Picker Dialog */}
      <Dialog
        visible={classPickerVisible}
        onDismiss={() => setClassPickerVisible(false)}
        style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
      >
        <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0, maxHeight: 400 }}>
          <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
            {classes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.modalItem, { borderBottomColor: colors.backgroundSelected }]}
                onPress={() => handleClassSelect(item.id)}
              >
                <ThemedText style={{ color: colors.text }}>
                  {item.name} - {item.section}
                </ThemedText>
                {(pickerTarget === 'create' ? form.classId : editForm.classId) === item.id && (
                  <Ionicons name="checkmark" size={18} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={() => setClassPickerVisible(false)}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Teacher Picker Dialog */}
      <Dialog
        visible={teacherPickerVisible}
        onDismiss={() => setTeacherPickerVisible(false)}
        style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
      >
        <Dialog.Title style={{ color: colors.text }}>Select Teacher</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0, maxHeight: 400 }}>
          <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
            {[{ id: '', name: 'None (Unassigned)' }, ...teachers].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.modalItem, { borderBottomColor: colors.backgroundSelected }]}
                onPress={() => handleTeacherSelect(item.id)}
              >
                <ThemedText style={{ color: colors.text, fontStyle: item.id === '' ? 'italic' : 'normal' }}>
                  {item.name}
                </ThemedText>
                {(pickerTarget === 'create' ? form.teacherId : editForm.teacherId) === item.id && (
                  <Ionicons name="checkmark" size={18} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={() => setTeacherPickerVisible(false)}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
});
