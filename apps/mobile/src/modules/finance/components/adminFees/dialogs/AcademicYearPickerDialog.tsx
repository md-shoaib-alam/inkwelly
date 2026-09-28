import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Portal, Dialog } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';

interface AcademicYearPickerDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  academicYears: any[];
  onSelectYear: (yearName: string) => void;
}

export function AcademicYearPickerDialog({
  visible,
  onDismiss,
  colors,
  academicYears,
  onSelectYear
}: AcademicYearPickerDialogProps) {
  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={{ backgroundColor: colors.backgroundElement }}
      >
        <Dialog.Title style={{ color: colors.text }}>Select Academic Year</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          <ScrollView>
            {academicYears.map((y) => (
              <TouchableOpacity
                key={y.id}
                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }}
                onPress={() => {
                  onSelectYear(y.name);
                }}
              >
                <ThemedText style={{ color: colors.text }}>{y.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  );
}
