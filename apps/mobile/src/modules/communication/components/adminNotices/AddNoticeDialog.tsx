import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { Dialog, Portal, Button, RadioButton } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Notice } from './types';

interface AddNoticeDialogProps {
  visible: boolean;
  onDismiss: () => void;
  editingNotice: Notice | null;
  submitting: boolean;
  colors: any;
  onSave: (data: { title: string; content: string; priority: string; targetRole: string }) => void;
}

export function AddNoticeDialog({
  visible,
  onDismiss,
  editingNotice,
  submitting,
  colors,
  onSave,
}: AddNoticeDialogProps) {
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState('normal');
  const [formTargetRole, setFormTargetRole] = useState('all');

  useEffect(() => {
    if (visible) {
      if (editingNotice) {
        setFormTitle(editingNotice.title);
        setFormContent(editingNotice.content);
        setFormPriority(editingNotice.priority);
        setFormTargetRole(editingNotice.targetRole);
      } else {
        setFormTitle('');
        setFormContent('');
        setFormPriority('normal');
        setFormTargetRole('all');
      }
    }
  }, [visible, editingNotice]);

  const handleSaveClick = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    onSave({
      title: formTitle.trim(),
      content: formContent.trim(),
      priority: formPriority,
      targetRole: formTargetRole,
    });
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
      >
        <Dialog.Title style={{ color: colors.text }}>
          {editingNotice ? 'Edit School Notice' : 'Create School Notice'}
        </Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 8 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Title</ThemedText>
            <TextInput
              placeholder="Notice Title"
              placeholderTextColor={colors.textSecondary}
              value={formTitle}
              onChangeText={setFormTitle}
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
            />

            <ThemedText style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Content</ThemedText>
            <TextInput
              placeholder="Notice details..."
              placeholderTextColor={colors.textSecondary}
              value={formContent}
              onChangeText={setFormContent}
              multiline
              numberOfLines={4}
              style={[styles.modalInput, styles.multilineInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
            />

            <ThemedText style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Priority</ThemedText>
            <View style={styles.radioGroup}>
              {['normal', 'high'].map((p) => (
                <TouchableOpacity 
                  key={p} 
                  style={styles.radioOption} 
                  onPress={() => setFormPriority(p)}
                >
                  <RadioButton
                    value={p}
                    status={formPriority === p ? 'checked' : 'unchecked'}
                    onPress={() => setFormPriority(p)}
                    color="#007AFF"
                    uncheckedColor={colors.textSecondary}
                  />
                  <ThemedText style={{ color: colors.text, textTransform: 'capitalize' }}>{p}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Target Audience</ThemedText>
            <View style={styles.radioGroupWrap}>
              {['all', 'teacher', 'parent', 'student', 'staff'].map((role) => (
                <TouchableOpacity 
                  key={role} 
                  style={styles.radioOption} 
                  onPress={() => setFormTargetRole(role)}
                >
                  <RadioButton
                    value={role}
                    status={formTargetRole === role ? 'checked' : 'unchecked'}
                    onPress={() => setFormTargetRole(role)}
                    color="#007AFF"
                    uncheckedColor={colors.textSecondary}
                  />
                  <ThemedText style={{ color: colors.text, textTransform: 'capitalize' }}>{role}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={{ gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
          <Button 
            mode="outlined"
            textColor={colors.textSecondary} 
            onPress={onDismiss}
            style={{ borderRadius: 999, borderColor: colors.backgroundSelected }}
            contentStyle={{ paddingHorizontal: 16, paddingVertical: 2 }}
          >
            Cancel
          </Button>
          <Button 
            mode="contained"
            textColor="#FFF" 
            buttonColor="#007AFF"
            loading={submitting} 
            disabled={submitting || !formTitle.trim() || !formContent.trim()}
            onPress={handleSaveClick}
            style={{ borderRadius: 999 }}
            contentStyle={{ paddingHorizontal: 16, paddingVertical: 2 }}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 4,
  },
  multilineInput: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  radioGroupWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
