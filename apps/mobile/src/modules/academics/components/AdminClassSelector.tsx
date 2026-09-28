import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Portal, Dialog, RadioButton, Button, ActivityIndicator } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';

interface ClassSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  showAllOption?: boolean;
}

export function ClassSelector({ value, onValueChange, showAllOption = false }: ClassSelectorProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const [visible, setVisible] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string; section: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchClasses() {
      try {
        setIsLoading(true);
        const res = await api.get('/classes?mode=min') as any;
        const classesList = Array.isArray(res) 
          ? res 
          : (res && Array.isArray(res.items) ? res.items : []);
        setClasses(classesList);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClasses();
  }, []);

  const selectedClass = showAllOption && value === 'all' 
    ? { name: 'All Classes', section: '' }
    : classes.find(c => c.id === value) || { name: 'Select Class', section: '' };

  return (
    <View>
      <TouchableOpacity 
        style={[
          styles.trigger, 
          { 
            backgroundColor: colors.backgroundElement,
            borderColor: colors.backgroundSelected
          }
        ]} 
        onPress={() => setVisible(true)}
      >
        <ThemedText style={[styles.triggerText, { color: colors.text }]}>
          {selectedClass.name}{selectedClass.section ? ` - ${selectedClass.section}` : ''}
        </ThemedText>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Portal>
        <Dialog 
          visible={visible} 
          onDismiss={() => setVisible(false)} 
          style={[styles.dialog, { backgroundColor: colors.backgroundElement }]}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected }}>
            {isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color="#007AFF" />
              </View>
            ) : (
              <ScrollView>
                <RadioButton.Group onValueChange={val => {
                  onValueChange(val);
                  setVisible(false);
                }} value={value}>
                  {showAllOption && (
                    <RadioButton.Item 
                      label="All Classes" 
                      value="all" 
                      labelStyle={{ color: colors.text }}
                      uncheckedColor={colors.textSecondary}
                      color="#007AFF"
                    />
                  )}
                  {classes.map((c) => (
                    <RadioButton.Item 
                      key={c.id} 
                      label={`${c.name} - ${c.section}`} 
                      value={c.id} 
                      labelStyle={{ color: colors.text }}
                      uncheckedColor={colors.textSecondary}
                      color="#007AFF"
                    />
                  ))}
                </RadioButton.Group>
              </ScrollView>
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  triggerText: {
    fontSize: 14,
    marginRight: 6,
  },
  dialog: {
    maxHeight: '60%',
  },
  center: {
    padding: 20,
    alignItems: 'center',
  },
});
