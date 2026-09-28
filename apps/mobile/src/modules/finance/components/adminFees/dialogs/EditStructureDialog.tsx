import React from 'react';
import { ScrollView, TextInput, StyleSheet } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { FeeStructure } from '../types';

interface EditStructureDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  editingStructureItem: FeeStructure | null;
  editingStructureAmount: string;
  setEditingStructureAmount: (amount: string) => void;
  savingStructure: boolean;
  onSave: () => void;
}

export function EditStructureDialog({
  visible,
  onDismiss,
  colors,
  editingStructureItem,
  editingStructureAmount,
  setEditingStructureAmount,
  savingStructure,
  onSave
}: EditStructureDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
        <Dialog.Title style={{ color: colors.text }}>Edit Fee Amount</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
              {editingStructureItem?.feeCategoryName} - {editingStructureItem?.className}
            </ThemedText>
            <ThemedText style={styles.inputLabel}>Amount (₹)</ThemedText>
            <TextInput
              placeholder="Amount in ₹"
              placeholderTextColor={colors.textSecondary}
              value={editingStructureAmount}
              onChangeText={setEditingStructureAmount}
              keyboardType="numeric"
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
            />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={onDismiss}>Cancel</Button>
          <Button textColor="#007AFF" onPress={onSave} disabled={savingStructure}>
            {savingStructure ? 'Saving...' : 'Save'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8e8e93',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});
