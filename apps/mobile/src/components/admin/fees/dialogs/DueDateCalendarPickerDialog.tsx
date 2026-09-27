import React from 'react';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';

interface DueDateCalendarPickerDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  manualDueDate: string;
  onSelectDate: (dateString: string) => void;
}

export function DueDateCalendarPickerDialog({
  visible,
  onDismiss,
  colors,
  manualDueDate,
  onSelectDate
}: DueDateCalendarPickerDialogProps) {
  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
      >
        <Dialog.Title style={{ color: colors.text }}>Select Due Date</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0, borderColor: colors.backgroundSelected }}>
          <Calendar
            current={manualDueDate}
            onDayPress={(day) => {
              onSelectDate(day.dateString);
            }}
            markedDates={{
              [manualDueDate]: { selected: true, selectedColor: '#007AFF' }
            }}
            theme={{
              backgroundColor: colors.backgroundElement,
              calendarBackground: colors.backgroundElement,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: '#007AFF',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#007AFF',
              dayTextColor: colors.text,
              textDisabledColor: colors.backgroundSelected,
              dotColor: '#007AFF',
              selectedDotColor: '#ffffff',
              arrowColor: '#007AFF',
              disabledArrowColor: colors.backgroundSelected,
              monthTextColor: colors.text,
              indicatorColor: '#007AFF',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 14,
              textMonthFontSize: 15,
              textDayHeaderFontSize: 12
            }}
          />
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
