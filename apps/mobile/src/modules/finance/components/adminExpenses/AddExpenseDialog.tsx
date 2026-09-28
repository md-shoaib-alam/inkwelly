import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Button, HelperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { CategoryInfo, ExpenseInfo } from './types';

interface AddExpenseDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  editingExpense: ExpenseInfo | null;
  expenseForm: {
    amount: string;
    date: string;
    description: string;
    categoryId: string;
    paymentMethod: string;
    referenceNo: string;
    status: string;
  };
  setExpenseForm: React.Dispatch<React.SetStateAction<{
    amount: string;
    date: string;
    description: string;
    categoryId: string;
    paymentMethod: string;
    referenceNo: string;
    status: string;
  }>>;
  categories: CategoryInfo[];
  savingExpense: boolean;
  onSubmit: () => void;
}

export function AddExpenseDialog({
  visible,
  onDismiss,
  colors,
  editingExpense,
  expenseForm,
  setExpenseForm,
  categories,
  savingExpense,
  onSubmit,
}: AddExpenseDialogProps) {
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);

  return (
    <>
      <Portal>
        <Dialog 
          visible={visible} 
          onDismiss={onDismiss}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>
            {editingExpense ? 'Edit Expense' : 'Add Expense'}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView contentContainerStyle={{ paddingVertical: 10, gap: 14 }}>
              <View>
                <ThemedText style={styles.dialogInputLabel}>Amount (INR) *</ThemedText>
                <TextInput
                  value={expenseForm.amount}
                  onChangeText={(t) => setExpenseForm(prev => ({ ...prev, amount: t }))}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.dialogInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
                />
              </View>

              {/* Category Select Picker */}
              <View>
                <ThemedText style={styles.dialogInputLabel}>Category *</ThemedText>
                <TouchableOpacity 
                  style={[styles.dialogDropdown, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                  onPress={() => setCategorySelectOpen(true)}
                >
                  <ThemedText style={{ color: expenseForm.categoryId ? colors.text : colors.textSecondary }}>
                    {categories.find(c => c.id === expenseForm.categoryId)?.name || 'Select Category'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View>
                <ThemedText style={styles.dialogInputLabel}>Date (YYYY-MM-DD) *</ThemedText>
                <TextInput
                  value={expenseForm.date}
                  onChangeText={(t) => setExpenseForm(prev => ({ ...prev, date: t }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.dialogInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
                />
                <HelperText type="info" style={{ paddingHorizontal: 0 }}>
                  Format: YYYY-MM-DD (e.g. 2026-06-12)
                </HelperText>
              </View>

              <View>
                <ThemedText style={styles.dialogInputLabel}>Description</ThemedText>
                <TextInput
                  value={expenseForm.description}
                  onChangeText={(t) => setExpenseForm(prev => ({ ...prev, description: t }))}
                  placeholder="Receipt context, vendor details..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.dialogInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
                />
              </View>

              {/* Payment Method */}
              <View>
                <ThemedText style={styles.dialogInputLabel}>Payment Method</ThemedText>
                <View style={styles.paymentMethodRow}>
                  {['cash', 'card', 'bank_transfer', 'cheque'].map((method) => {
                    const isMethodActive = expenseForm.paymentMethod === method;
                    return (
                      <TouchableOpacity
                        key={method}
                        onPress={() => setExpenseForm(prev => ({ ...prev, paymentMethod: method }))}
                        style={[
                          styles.paymentMethodButton,
                          isMethodActive 
                            ? { backgroundColor: '#FF3B30' } 
                            : { backgroundColor: colors.background, borderColor: colors.backgroundSelected }
                        ]}
                      >
                        <ThemedText style={[styles.paymentMethodBtnText, { color: isMethodActive ? '#FFFFFF' : colors.text }]}>
                          {method.replace('_', ' ').toUpperCase()}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <ThemedText style={styles.dialogInputLabel}>Reference / Receipt No</ThemedText>
                <TextInput
                  value={expenseForm.referenceNo}
                  onChangeText={(t) => setExpenseForm(prev => ({ ...prev, referenceNo: t }))}
                  placeholder="TXN-12903, REC-4809"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.dialogInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
                />
              </View>

              {/* Status */}
              <View>
                <ThemedText style={styles.dialogInputLabel}>Status</ThemedText>
                <View style={styles.paymentMethodRow}>
                  {['paid', 'pending'].map((st) => {
                    const isStatusActive = expenseForm.status === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        onPress={() => setExpenseForm(prev => ({ ...prev, status: st }))}
                        style={[
                          styles.paymentMethodButton,
                          isStatusActive 
                            ? { backgroundColor: '#34C759' } 
                            : { backgroundColor: colors.background, borderColor: colors.backgroundSelected }
                        ]}
                      >
                        <ThemedText style={[styles.paymentMethodBtnText, { color: isStatusActive ? '#FFFFFF' : colors.text }]}>
                          {st.toUpperCase()}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={onDismiss}>Cancel</Button>
            <Button 
              textColor="#FF3B30" 
              loading={savingExpense}
              disabled={savingExpense}
              onPress={onSubmit}
            >
              Save Expense
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Category Selector Dialog */}
        <Dialog 
          visible={categorySelectOpen} 
          onDismiss={() => setCategorySelectOpen(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Category</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat.id}
                  style={styles.dialogSelectRow}
                  onPress={() => {
                    setExpenseForm(prev => ({ ...prev, categoryId: cat.id }));
                    setCategorySelectOpen(false);
                  }}
                >
                  <ThemedText style={{ color: expenseForm.categoryId === cat.id ? '#007AFF' : colors.text }}>
                    {cat.name}
                  </ThemedText>
                  {expenseForm.categoryId === cat.id && <Ionicons name="checkmark" size={18} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setCategorySelectOpen(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  dialogScroll: {
    maxHeight: 280,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dialogInputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dialogInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  dialogDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  paymentMethodBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  dialogSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
  },
});
