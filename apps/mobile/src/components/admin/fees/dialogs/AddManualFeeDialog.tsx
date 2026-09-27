import React from 'react';
import { ScrollView, View, TouchableOpacity, TextInput, Switch, StyleSheet } from 'react-native';
import { Portal, Dialog, Button, RadioButton } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { FeeCategory } from '../types';

interface AddManualFeeDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  manualCategory: string;
  manualCustomType: string;
  setManualCustomType: (type: string) => void;
  manualAmount: string;
  setManualAmount: (amount: string) => void;
  manualDueDate: string;
  manualRemarks: string;
  setManualRemarks: (remarks: string) => void;
  manualMarkPaid: boolean;
  setManualMarkPaid: (markPaid: boolean) => void;
  manualPaymentMethod: string;
  setManualPaymentMethod: (method: string) => void;
  categories: FeeCategory[];
  submittingManualFee: boolean;
  onTriggerCategoryPicker: () => void;
  onTriggerDatePicker: () => void;
  onSubmit: () => void;
}

export function AddManualFeeDialog({
  visible,
  onDismiss,
  colors,
  manualCategory,
  manualCustomType,
  setManualCustomType,
  manualAmount,
  setManualAmount,
  manualDueDate,
  manualRemarks,
  setManualRemarks,
  manualMarkPaid,
  setManualMarkPaid,
  manualPaymentMethod,
  setManualPaymentMethod,
  categories,
  submittingManualFee,
  onTriggerCategoryPicker,
  onTriggerDatePicker,
  onSubmit
}: AddManualFeeDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
        <Dialog.Title style={{ color: colors.text }}>Add Manual Payment Entry</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.inputLabel}>Fee Category</ThemedText>
            <TouchableOpacity 
              style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, marginBottom: 12 }]}
              onPress={onTriggerCategoryPicker}
            >
              <ThemedText style={{ color: colors.text }}>
                {manualCategory === 'custom' ? 'Custom Description...' : (categories.find(c => c.id === manualCategory)?.name || 'Select Category')}
              </ThemedText>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {manualCategory === 'custom' && (
              <>
                <ThemedText style={styles.inputLabel}>Fee Description *</ThemedText>
                <TextInput
                  placeholder="e.g. Uniform Fee, Field Trip"
                  placeholderTextColor={colors.textSecondary}
                  value={manualCustomType}
                  onChangeText={setManualCustomType}
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
                />
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.inputLabel}>Amount (₹) *</ThemedText>
                <TextInput
                  placeholder="Amount in ₹"
                  placeholderTextColor={colors.textSecondary}
                  value={manualAmount}
                  onChangeText={setManualAmount}
                  keyboardType="numeric"
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.inputLabel}>Due Date</ThemedText>
                <TouchableOpacity
                  onPress={onTriggerDatePicker}
                  style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected, height: 44, borderRadius: 8, paddingHorizontal: 12 }]}
                >
                  <ThemedText style={{ fontSize: 14, color: colors.text }}>{manualDueDate}</ThemedText>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ThemedText style={styles.inputLabel}>Remarks / Notes</ThemedText>
            <TextInput
              placeholder="e.g. Manual entry by Admin"
              placeholderTextColor={colors.textSecondary}
              value={manualRemarks}
              onChangeText={setManualRemarks}
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 12 }]}
            />

            {/* Instant payment toggle */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.backgroundSelected, backgroundColor: colors.background, marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ThemedText style={{ fontSize: 13, fontWeight: 'bold' }}>Record Payment Instantly</ThemedText>
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>Mark as paid immediately and generate a receipt</ThemedText>
              </View>
              <Switch
                value={manualMarkPaid}
                onValueChange={setManualMarkPaid}
                trackColor={{ false: colors.backgroundSelected, true: '#34C759' }}
              />
            </View>

            {manualMarkPaid && (
              <View style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#34C759', backgroundColor: 'rgba(52, 199, 89, 0.05)', marginBottom: 10 }}>
                <ThemedText style={styles.inputLabel}>Payment Method</ThemedText>
                <View style={styles.radioGroup}>
                  {['cash', 'online', 'upi', 'cheque'].map((method) => (
                    <TouchableOpacity key={method} style={styles.radioOption} onPress={() => setManualPaymentMethod(method)}>
                      <RadioButton
                        value={method}
                        status={manualPaymentMethod === method ? 'checked' : 'unchecked'}
                        onPress={() => setManualPaymentMethod(method)}
                        color="#34C759"
                        uncheckedColor={colors.textSecondary}
                      />
                      <ThemedText style={{ fontSize: 12, textTransform: 'capitalize' }}>{method}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={onDismiss} disabled={submittingManualFee}>Cancel</Button>
          <Button textColor="#007AFF" onPress={onSubmit} disabled={submittingManualFee || !manualAmount || (manualCategory === 'custom' && !manualCustomType)}>
            {submittingManualFee ? 'Recording...' : (manualMarkPaid ? 'Record Payment' : 'Add Pending Fee')}
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
