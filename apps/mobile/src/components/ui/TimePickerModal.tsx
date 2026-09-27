import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

interface TimePickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectTime: (timeStr: string) => void;
  value?: string; // Expects HH:MM (24h)
  title?: string;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES_5 = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function TimePickerModal({
  visible,
  onDismiss,
  onSelectTime,
  value,
  title = 'Select Time',
}: TimePickerModalProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('AM');

  // Sync with initial value (24h) and convert to 12h parts
  useEffect(() => {
    if (visible && value && value.includes(':')) {
      const [h24Str, mStr] = value.split(':');
      const h24 = parseInt(h24Str, 10);
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;

      const hourString = String(h12).padStart(2, '0');
      setSelectedHour(hourString);
      setSelectedAmPm(ampm);

      if (MINUTES_5.includes(mStr)) {
        setSelectedMinute(mStr);
      } else {
        const minVal = parseInt(mStr, 10);
        const roundedMin = String(Math.round(minVal / 5) * 5).padStart(2, '0');
        setSelectedMinute(MINUTES_5.includes(roundedMin) ? roundedMin : '00');
      }
    }
  }, [visible, value]);

  const handleConfirm = () => {
    // Convert 12h parts to 24h format for saving
    let h24 = parseInt(selectedHour, 10);
    if (selectedAmPm === 'PM' && h24 < 12) h24 += 12;
    if (selectedAmPm === 'AM' && h24 === 12) h24 = 0;
    const h24Str = String(h24).padStart(2, '0');
    
    onSelectTime(`${h24Str}:${selectedMinute}`);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={[styles.dialog, { backgroundColor: colors.backgroundElement }]}>
        <Dialog.Title style={{ color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          {title}
        </Dialog.Title>

        <Dialog.Content style={styles.content}>
          {/* Display Preview */}
          <View style={styles.timePreviewContainer}>
            <ThemedText style={[styles.timePreviewText, { color: colors.text }]}>
              {selectedHour} : {selectedMinute} {selectedAmPm}
            </ThemedText>
          </View>

          {/* Side-by-side simple columns */}
          <View style={styles.columnsContainer}>
            {/* Hour Column */}
            <View style={styles.column}>
              <ThemedText style={[styles.columnHeader, { color: colors.textSecondary }]}>HOUR</ThemedText>
              <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.columnScroll}>
                {HOURS_12.map(h => {
                  const isSelected = selectedHour === h;
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.cell,
                        isSelected && { backgroundColor: '#007AFF' }
                      ]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <ThemedText style={[styles.cellText, { color: isSelected ? '#FFF' : colors.text }]}>
                        {h}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.backgroundSelected }]} />

            {/* Minute Column */}
            <View style={styles.column}>
              <ThemedText style={[styles.columnHeader, { color: colors.textSecondary }]}>MINUTE</ThemedText>
              <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.columnScroll}>
                {MINUTES_5.map(m => {
                  const isSelected = selectedMinute === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.cell,
                        isSelected && { backgroundColor: '#007AFF' }
                      ]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <ThemedText style={[styles.cellText, { color: isSelected ? '#FFF' : colors.text }]}>
                        {m}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.backgroundSelected }]} />

            {/* AM/PM Column */}
            <View style={[styles.column, { justifyContent: 'center', gap: 12 }]}>
              <TouchableOpacity
                style={[
                  styles.ampmBtn,
                  selectedAmPm === 'AM' ? { backgroundColor: '#007AFF' } : { backgroundColor: colors.backgroundSelected }
                ]}
                onPress={() => setSelectedAmPm('AM')}
              >
                <ThemedText style={[styles.ampmText, { color: selectedAmPm === 'AM' ? '#FFF' : colors.text }]}>
                  AM
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ampmBtn,
                  selectedAmPm === 'PM' ? { backgroundColor: '#007AFF' } : { backgroundColor: colors.backgroundSelected }
                ]}
                onPress={() => setSelectedAmPm('PM')}
              >
                <ThemedText style={[styles.ampmText, { color: selectedAmPm === 'PM' ? '#FFF' : colors.text }]}>
                  PM
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Dialog.Content>

        <Dialog.Actions style={[styles.actions, { gap: 10 }]}>
          <Button 
            mode="outlined" 
            textColor="#007AFF" 
            style={{ borderRadius: 20, borderColor: '#007AFF', borderWidth: 1, minWidth: 100 }} 
            labelStyle={{ fontWeight: '600' }}
            onPress={onDismiss}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            buttonColor="#007AFF" 
            textColor="#FFF" 
            style={{ borderRadius: 20, minWidth: 100 }} 
            labelStyle={{ fontWeight: '700' }}
            onPress={handleConfirm}
          >
            Confirm
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 24,
    width: '95%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: 8,
  },
  timePreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  timePreviewText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
  columnsContainer: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'stretch',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  columnScroll: {
    alignItems: 'center',
    paddingBottom: 20,
    width: '100%',
  },
  divider: {
    width: 1,
    marginVertical: 10,
  },
  cell: {
    width: '80%',
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  cellText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ampmBtn: {
    width: '80%',
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
