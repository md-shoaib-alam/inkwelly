import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

interface GenerateCertificateDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  classes: { id: string; name: string; section: string }[];
  students: { id: string; name: string }[];
  studentsLoading: boolean;
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  formStudentId: string;
  setFormStudentId: (id: string) => void;
  formCertType: string;
  setFormCertType: (type: string) => void;
  formIssueDate: string;
  setFormIssueDate: (date: string) => void;
  formNotes: string;
  setFormNotes: (notes: string) => void;
  isSubmitting: boolean;
  onGenerate: () => void;
}

export function GenerateCertificateDialog({
  visible,
  onDismiss,
  colors,
  classes,
  students,
  studentsLoading,
  selectedClassId,
  setSelectedClassId,
  formStudentId,
  setFormStudentId,
  formCertType,
  setFormCertType,
  formIssueDate,
  setFormIssueDate,
  formNotes,
  setFormNotes,
  isSubmitting,
  onGenerate,
}: GenerateCertificateDialogProps) {
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  return (
    <>
      <Portal>
        <Dialog 
          visible={visible} 
          onDismiss={() => !isSubmitting && onDismiss()}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Generate Student Certificate</Dialog.Title>
          <Dialog.Content>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* Select Class */}
              <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Class & Section</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]} 
                onPress={() => setClassPickerOpen(true)}
              >
                <ThemedText style={{ color: selectedClassId ? colors.text : colors.textSecondary }}>
                  {selectedClassId ? `${classes.find(c => c.id === selectedClassId)?.name} - ${classes.find(c => c.id === selectedClassId)?.section}` : 'Select Class'}
                </ThemedText>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Select Student */}
              <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Student</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]} 
                onPress={() => {
                  if (!selectedClassId) {
                    Alert.alert('Info', 'Please select a class first.');
                    return;
                  }
                  setStudentPickerOpen(true);
                }}
                disabled={!selectedClassId || studentsLoading}
              >
                {studentsLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <ThemedText style={{ color: formStudentId ? colors.text : colors.textSecondary }}>
                    {formStudentId ? students.find(s => s.id === formStudentId)?.name : 'Select Student'}
                  </ThemedText>
                )}
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Certificate Type */}
              <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Certificate Type</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]} 
                onPress={() => setTypePickerOpen(true)}
              >
                <ThemedText style={{ color: colors.text, textTransform: 'capitalize' }}>
                  {formCertType} Certificate
                </ThemedText>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Date */}
              <View style={{ marginTop: 14 }}>
                <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Date of Issue</ThemedText>
                <TextInput
                  value={formIssueDate}
                  onChangeText={setFormIssueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.textInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
                />
              </View>

              {/* Notes */}
              <View style={{ marginTop: 14 }}>
                <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Notes / Remarks</ThemedText>
                <TextInput
                  value={formNotes}
                  onChangeText={setFormNotes}
                  placeholder="e.g. Purpose of issue..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  style={[styles.textArea, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
                />
              </View>

            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions style={{ gap: 8, paddingHorizontal: 16, paddingBottom: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
            <TouchableOpacity 
              disabled={isSubmitting} 
              onPress={onDismiss}
              style={{ paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' }}
            >
              <ThemedText style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              disabled={isSubmitting}
              onPress={onGenerate}
              style={{ 
                borderRadius: 12, 
                backgroundColor: '#92400E', 
                paddingHorizontal: 20, 
                height: 40, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 6
              }}
            >
              {isSubmitting && <ActivityIndicator size="small" color="#FFF" />}
              <ThemedText style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
                Generate
              </ThemedText>
            </TouchableOpacity>
          </Dialog.Actions>
        </Dialog>

        {/* Picker Sub-Dialogs */}
        {/* Class Picker */}
        <Dialog visible={classPickerOpen} onDismiss={() => setClassPickerOpen(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView style={{ maxHeight: 250 }}>
              {classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pickerItem, { borderBottomColor: colors.backgroundSelected }]}
                  onPress={() => {
                    setSelectedClassId(c.id);
                    setFormStudentId('');
                    setClassPickerOpen(false);
                  }}
                >
                  <ThemedText style={{ color: colors.text }}>{c.name} - {c.section}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setClassPickerOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Student Picker */}
        <Dialog visible={studentPickerOpen} onDismiss={() => setStudentPickerOpen(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Select Student</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView style={{ maxHeight: 250 }}>
              {students.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pickerItem, { borderBottomColor: colors.backgroundSelected }]}
                  onPress={() => {
                    setFormStudentId(s.id);
                    setStudentPickerOpen(false);
                  }}
                >
                  <ThemedText style={{ color: colors.text }}>{s.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setStudentPickerOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Certificate Type Picker */}
        <Dialog visible={typePickerOpen} onDismiss={() => setTypePickerOpen(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Select Certificate Type</Dialog.Title>
          <Dialog.Content>
            {['bonafide', 'transfer', 'character'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerItem, { borderBottomColor: colors.backgroundSelected }]}
                onPress={() => {
                  setFormCertType(type);
                  setTypePickerOpen(false);
                }}
              >
                <ThemedText style={{ color: colors.text, textTransform: 'capitalize' }}>{type} Certificate</ThemedText>
              </TouchableOpacity>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setTypePickerOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
});
