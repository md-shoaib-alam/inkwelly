import React from 'react';
import { ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { FeeCategory, ClassOption } from '../types';

interface StructureDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  structureCategoryId: string;
  structureClassId: string;
  structureAmount: string;
  setStructureAmount: (amount: string) => void;
  structureYear: string;
  categories: FeeCategory[];
  classes: ClassOption[];
  onTriggerCategoryPicker: () => void;
  onTriggerClassPicker: () => void;
  onTriggerYearPicker: () => void;
  onSubmit: () => void;
}

export function StructureDialog({
  visible,
  onDismiss,
  colors,
  structureCategoryId,
  structureClassId,
  structureAmount,
  setStructureAmount,
  structureYear,
  categories,
  classes,
  onTriggerCategoryPicker,
  onTriggerClassPicker,
  onTriggerYearPicker,
  onSubmit
}: StructureDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
        <Dialog.Title style={{ color: colors.text }}>Set Class Fees</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.inputLabel}>Fee Category</ThemedText>
            <TouchableOpacity 
              style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
              onPress={onTriggerCategoryPicker}
            >
              <ThemedText style={{ color: structureCategoryId ? colors.text : colors.textSecondary }}>
                {structureCategoryId ? (categories.find(c => c.id === structureCategoryId)?.name || 'Select Category') : 'Choose Category...'}
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.inputLabel}>Assigned Class</ThemedText>
            <TouchableOpacity 
              style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
              onPress={onTriggerClassPicker}
            >
              <ThemedText style={{ color: structureClassId ? colors.text : colors.textSecondary }}>
                {structureClassId ? (classes.find(c => c.id === structureClassId)?.name || 'Select Class') : 'Choose Class...'}
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.inputLabel}>Fee Amount (₹)</ThemedText>
            <TextInput
              placeholder="e.g. 5000"
              placeholderTextColor={colors.textSecondary}
              value={structureAmount}
              onChangeText={setStructureAmount}
              keyboardType="numeric"
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
            />

            <ThemedText style={styles.inputLabel}>Academic Year</ThemedText>
            <TouchableOpacity 
              style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
              onPress={onTriggerYearPicker}
            >
              <ThemedText style={{ color: structureYear ? colors.text : colors.textSecondary }}>
                {structureYear || 'Choose Year...'}
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={onDismiss}>Cancel</Button>
          <Button textColor="#007AFF" onPress={onSubmit}>Configure</Button>
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
  pickerTrigger: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});
