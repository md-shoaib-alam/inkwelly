import React from 'react';
import { ScrollView, View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Portal, Dialog, Button, RadioButton } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { StudentOption, FeeCategory } from '../types';

interface ConcessionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  concessionStudentId: string;
  concessionCategoryId: string;
  concessionType: string;
  setConcessionType: (type: string) => void;
  concessionAmount: string;
  setConcessionAmount: (amount: string) => void;
  concessionReason: string;
  setConcessionReason: (reason: string) => void;
  students: StudentOption[];
  categories: FeeCategory[];
  onTriggerStudentPicker: () => void;
  onTriggerCategoryPicker: () => void;
  onSubmit: () => void;
}

export function ConcessionDialog({
  visible,
  onDismiss,
  colors,
  concessionStudentId,
  concessionCategoryId,
  concessionType,
  setConcessionType,
  concessionAmount,
  setConcessionAmount,
  concessionReason,
  setConcessionReason,
  students,
  categories,
  onTriggerStudentPicker,
  onTriggerCategoryPicker,
  onSubmit
}: ConcessionDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
        <Dialog.Title style={{ color: colors.text }}>Add Fee Concession</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.inputLabel}>Student</ThemedText>
            <TouchableOpacity 
              style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
              onPress={onTriggerStudentPicker}
            >
              <ThemedText style={{ color: concessionStudentId ? colors.text : colors.textSecondary }}>
                {concessionStudentId ? (students.find(s => s.id === concessionStudentId)?.name || 'Select Student') : 'Choose Student...'}
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.inputLabel}>Apply to Category</ThemedText>
            <TouchableOpacity 
              style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
              onPress={onTriggerCategoryPicker}
            >
              <ThemedText style={{ color: colors.text }}>
                {concessionCategoryId ? (categories.find(c => c.id === concessionCategoryId)?.name || 'All Categories') : 'All Fee Categories'}
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.inputLabel}>Concession Type</ThemedText>
            <View style={styles.radioGroup}>
              {[
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'fixed', label: 'Fixed Amount (₹)' },
                { value: 'full_waiver', label: 'Full Waiver' }
              ].map((type) => (
                <TouchableOpacity key={type.value} style={styles.radioOption} onPress={() => setConcessionType(type.value)}>
                  <RadioButton
                    value={type.value}
                    status={concessionType === type.value ? 'checked' : 'unchecked'}
                    onPress={() => setConcessionType(type.value)}
                    color="#007AFF"
                    uncheckedColor={colors.textSecondary}
                  />
                  <ThemedText style={{ fontSize: 12 }}>{type.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {concessionType !== 'full_waiver' && (
              <>
                <ThemedText style={[styles.inputLabel, { marginTop: 10 }]}>Value</ThemedText>
                <TextInput
                  placeholder={concessionType === 'percentage' ? "e.g. 15 (%)" : "e.g. 1200 (₹)"}
                  placeholderTextColor={colors.textSecondary}
                  value={concessionAmount}
                  onChangeText={setConcessionAmount}
                  keyboardType="numeric"
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
                />
              </>
            )}

            <ThemedText style={[styles.inputLabel, { marginTop: 10 }]}>Reason / Remarks</ThemedText>
            <TextInput
              placeholder="Scholarship, sibling discount, etc..."
              placeholderTextColor={colors.textSecondary}
              value={concessionReason}
              onChangeText={setConcessionReason}
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
            />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={onDismiss}>Cancel</Button>
          <Button textColor="#007AFF" onPress={onSubmit}>Apply</Button>
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
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});
