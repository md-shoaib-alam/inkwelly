import React, { useState, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectDate: (dateStr: string) => void;
  value?: string; // Expects YYYY-MM-DD
  title?: string;
  minDate?: string; // Expects YYYY-MM-DD
  maxDate?: string; // Expects YYYY-MM-DD
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePickerModal({
  visible,
  onDismiss,
  onSelectDate,
  value,
  title = 'Select Date',
  minDate,
  maxDate
}: DatePickerModalProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  // Internal state for selected year/month/day
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [pickerMode, setPickerMode] = useState<'calendar' | 'month' | 'year'>('calendar');

  // Sync with initial value when modal opens or value changes using render-time state adjustment
  const [prevVisible, setPrevVisible] = useState(visible);
  const [prevValue, setPrevValue] = useState(value);

  if (visible !== prevVisible || value !== prevValue) {
    setPrevVisible(visible);
    setPrevValue(value);
    if (visible) {
      setPickerMode('calendar');
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        setSelectedDateStr(value);
        const [y, m] = value.split('-').map(Number);
        setCurrentYear(y);
        setCurrentMonth(m - 1); // convert to 0-index
      } else {
        const today = new Date();
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
        setSelectedDateStr('');
      }
    }
  }

  // Handle month changes
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate grid values
  const gridCells = useMemo(() => {
    const cells = [];
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Fill blank cells for days before the 1st of this month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNumber: null, key: `empty-${i}` });
    }

    // Fill days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const fullDateStr = `${currentYear}-${monthStr}-${dayStr}`;
      cells.push({
        dayNumber: day,
        dateString: fullDateStr,
        key: `day-${day}`
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  const handleDaySelect = (dateStr: string) => {
    setSelectedDateStr(dateStr);
  };

  const handleConfirm = () => {
    if (selectedDateStr) {
      onSelectDate(selectedDateStr);
    }
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={[styles.dialog, { backgroundColor: colors.backgroundElement }]}>
        <Dialog.Title style={{ color: colors.text, fontSize: 18, fontWeight: '700', paddingHorizontal: 8, marginTop: 16 }}>{title}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          {/* Calendar Header with Month/Year Selection */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn} activeOpacity={0.6}>
              <Ionicons name="chevron-back" size={22} color="#007AFF" />
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {/* Month Selector Button */}
              <TouchableOpacity 
                onPress={() => setPickerMode(prev => prev === 'month' ? 'calendar' : 'month')} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 4, 
                  paddingVertical: 4, 
                  paddingHorizontal: 8, 
                  borderRadius: 8, 
                  backgroundColor: pickerMode === 'month' ? (activeTheme === 'dark' ? '#2C2C2E' : '#E5E5EA') : 'transparent' 
                }}
                activeOpacity={0.7}
              >
                <ThemedText type="defaultSemiBold" style={[styles.monthYearLabel, { color: colors.text }]}>
                  {MONTHS[currentMonth]}
                </ThemedText>
                <Ionicons name={pickerMode === 'month' ? "chevron-up" : "chevron-down"} size={14} color="#007AFF" />
              </TouchableOpacity>

              {/* Year Selector Button */}
              <TouchableOpacity 
                onPress={() => setPickerMode(prev => prev === 'year' ? 'calendar' : 'year')} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 4, 
                  paddingVertical: 4, 
                  paddingHorizontal: 8, 
                  borderRadius: 8, 
                  backgroundColor: pickerMode === 'year' ? (activeTheme === 'dark' ? '#2C2C2E' : '#E5E5EA') : 'transparent' 
                }}
                activeOpacity={0.7}
              >
                <ThemedText type="defaultSemiBold" style={[styles.monthYearLabel, { color: colors.text }]}>
                  {currentYear}
                </ThemedText>
                <Ionicons name={pickerMode === 'year' ? "chevron-up" : "chevron-down"} size={14} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn} activeOpacity={0.6}>
              <Ionicons name="chevron-forward" size={22} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {pickerMode === 'month' ? (
            <View style={{ height: 200, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {MONTHS.map((monthName, index) => {
                  const isSelected = currentMonth === index;
                  return (
                    <TouchableOpacity
                      key={monthName}
                      style={{
                        width: '30%',
                        paddingVertical: 10,
                        marginVertical: 4,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 12,
                        backgroundColor: isSelected ? '#007AFF' : (activeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#F2F2F7'),
                      }}
                      onPress={() => {
                        setCurrentMonth(index);
                        setPickerMode('calendar');
                      }}
                    >
                      <ThemedText style={{ color: isSelected ? '#FFF' : colors.text, fontWeight: isSelected ? 'bold' : '600', fontSize: 13 }}>
                        {monthName.slice(0, 3)}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : pickerMode === 'year' ? (
            <View style={{ height: 200 }}>
              <ScrollView 
                contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 8 }}
                showsVerticalScrollIndicator={true}
              >
                {Array.from({ length: 50 }, (_, i) => {
                  const year = new Date().getFullYear() - 40 + i; // Range: today-40 to today+9
                  const isSelected = currentYear === year;
                  return (
                    <TouchableOpacity
                      key={year}
                      style={{
                        width: '30%',
                        paddingVertical: 10,
                        marginVertical: 4,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 12,
                        backgroundColor: isSelected ? '#007AFF' : (activeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#F2F2F7'),
                      }}
                      onPress={() => {
                        setCurrentYear(year);
                        setPickerMode('calendar');
                      }}
                    >
                      <ThemedText style={{ color: isSelected ? '#FFF' : colors.text, fontWeight: isSelected ? 'bold' : '600', fontSize: 14 }}>
                        {year}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <>
              {/* Weekdays Row */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map(d => (
                  <ThemedText key={d} style={[styles.weekdayText, { color: colors.textSecondary }]}>
                    {d}
                  </ThemedText>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.grid}>
                {gridCells.map(cell => {
                  if (cell.dayNumber === null) {
                    return <View key={cell.key} style={styles.gridCellEmpty} />;
                  }

                  const isSelected = selectedDateStr === cell.dateString;
                  const isPast = !!(minDate && cell.dateString && cell.dateString < minDate);
                  const isFuture = !!(maxDate && cell.dateString && cell.dateString > maxDate);
                  const isDisabled = isPast || isFuture;

                  return (
                    <TouchableOpacity
                      key={cell.key}
                      style={[styles.gridCellDay, isDisabled && { opacity: 0.3 }]}
                      onPress={() => !isDisabled && handleDaySelect(cell.dateString!)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.dayInner,
                          isSelected && { 
                            backgroundColor: '#007AFF',
                            shadowColor: '#007AFF',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3,
                          }
                        ]}
                      >
                        <ThemedText 
                          style={[
                            styles.dayText, 
                            { color: isSelected ? '#FFF' : colors.text }
                          ]}
                        >
                          {cell.dayNumber}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}>
          <Button 
            textColor={colors.textSecondary} 
            onPress={onDismiss}
            labelStyle={{ fontWeight: '600', fontSize: 15 }}
          >
            Cancel
          </Button>
          <Button 
            textColor="#FFF" 
            buttonColor="#007AFF" 
            disabled={!selectedDateStr}
            onPress={handleConfirm}
            style={{ borderRadius: 24, paddingHorizontal: 24, height: 40, justifyContent: 'center' }}
            labelStyle={{ fontWeight: '700', fontSize: 15 }}
          >
            Select
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 24,
  },
  content: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  navBtn: {
    padding: 10,
  },
  monthYearLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 4,
  },
  weekdayText: {
    width: '14.2%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
  },
  gridCellEmpty: {
    width: '14.2%',
    height: 40,
  },
  gridCellDay: {
    width: '14.2%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
