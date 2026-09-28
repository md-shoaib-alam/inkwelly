import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Dialog, Portal, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { AcademicYear } from './types';

interface AddAcademicYearDialogProps {
  visible: boolean;
  onDismiss: () => void;
  dialogMode: 'create' | 'edit';
  editingYear: AcademicYear | null;
  isSubmitting: boolean;
  colors: any;
  activeTheme: string;
  onSubmit: (data: { name: string; startDate: string; endDate: string; status: string }) => void;
}

export function AddAcademicYearDialog({
  visible,
  onDismiss,
  dialogMode,
  editingYear,
  isSubmitting,
  colors,
  activeTheme,
  onSubmit,
}: AddAcademicYearDialogProps) {
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState('active');

  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      if (dialogMode === 'edit' && editingYear) {
        setFormName(editingYear.name);
        setFormStartDate(editingYear.startDate ? editingYear.startDate.split('T')[0] : '');
        setFormEndDate(editingYear.endDate ? editingYear.endDate.split('T')[0] : '');
        setFormStatus(editingYear.status);
      } else {
        setFormName('');
        setFormStartDate('');
        setFormEndDate('');
        setFormStatus('active');
      }
    }
  }, [visible, dialogMode, editingYear]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleSaveClick = () => {
    if (!formName.trim() || !formStartDate || !formEndDate) return;
    onSubmit({
      name: formName.trim(),
      startDate: formStartDate,
      endDate: formEndDate,
      status: formStatus,
    });
  };

  return (
    <>
      <Portal>
        <Dialog 
          visible={visible} 
          onDismiss={onDismiss}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>
            {dialogMode === 'create' ? 'Add Academic Year' : 'Edit Academic Year'}
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* Session Name */}
              <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Session Name</ThemedText>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. 2025-2026"
                placeholderTextColor={colors.textSecondary}
                style={[styles.textInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
              />

              {/* Start Date */}
              <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Start Date</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]} 
                onPress={() => setStartDatePickerVisible(true)}
              >
                <ThemedText style={{ color: formStartDate ? colors.text : colors.textSecondary }}>
                  {formStartDate ? formatDate(formStartDate) : 'Select Start Date'}
                </ThemedText>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* End Date */}
              <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>End Date</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]} 
                onPress={() => setEndDatePickerVisible(true)}
              >
                <ThemedText style={{ color: formEndDate ? colors.text : colors.textSecondary }}>
                  {formEndDate ? formatDate(formEndDate) : 'Select End Date'}
                </ThemedText>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Status Selector */}
              <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Status</ThemedText>
              <View style={styles.statusOptions}>
                <TouchableOpacity 
                  style={[styles.statusBtn, formStatus === 'active' && { backgroundColor: '#34C759' }]}
                  onPress={() => setFormStatus('active')}
                >
                  <ThemedText style={{ color: formStatus === 'active' ? '#FFF' : colors.text, fontWeight: '600' }}>Active</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.statusBtn, formStatus === 'inactive' && { backgroundColor: '#8E8E93' }]}
                  onPress={() => setFormStatus('inactive')}
                >
                  <ThemedText style={{ color: formStatus === 'inactive' ? '#FFF' : colors.text, fontWeight: '600' }}>Inactive</ThemedText>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={onDismiss}>Cancel</Button>
            <Button 
              textColor="#FFF" 
              buttonColor="#007AFF" 
              loading={isSubmitting} 
              disabled={isSubmitting || !formName.trim() || !formStartDate || !formEndDate}
              onPress={handleSaveClick}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Date Pickers */}
        <DatePickerModal
          visible={startDatePickerVisible}
          onDismiss={() => setStartDatePickerVisible(false)}
          value={formStartDate}
          onSelectDate={(dateStr) => setFormStartDate(dateStr)}
          title="Select Start Date"
        />

        <DatePickerModal
          visible={endDatePickerVisible}
          onDismiss={() => setEndDatePickerVisible(false)}
          value={formEndDate}
          onSelectDate={(dateStr) => setFormEndDate(dateStr)}
          title="Select End Date"
          minDate={formStartDate}
        />
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
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
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
  statusOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  statusBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
