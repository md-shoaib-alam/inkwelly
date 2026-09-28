import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ClassOption } from '../types';

interface ClassPickerDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  classes: ClassOption[];
  onSelectClass: (classId: string) => void;
}

export function ClassPickerDialog({
  visible,
  onDismiss,
  colors,
  classes,
  onSelectClass
}: ClassPickerDialogProps) {
  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={{ backgroundColor: colors.backgroundElement }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 8 }}>
          <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
          <TouchableOpacity onPress={onDismiss} style={{ padding: 8 }}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          <ScrollView>
            {classes.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }}
                onPress={() => {
                  onSelectClass(c.id);
                }}
              >
                <ThemedText style={{ color: colors.text }}>{c.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <TouchableOpacity 
            onPress={onDismiss} 
            style={{ 
              paddingHorizontal: 20, 
              paddingVertical: 8, 
              borderRadius: 20, 
              backgroundColor: colors.backgroundSelected || '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ThemedText style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Close</ThemedText>
          </TouchableOpacity>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
