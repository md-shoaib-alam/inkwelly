import React from 'react';
import { ScrollView, View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Portal, Dialog, Button, RadioButton } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';

interface CategoryDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  categoryName: string;
  setCategoryName: (name: string) => void;
  categoryCode: string;
  setCategoryCode: (code: string) => void;
  categoryDesc: string;
  setCategoryDesc: (desc: string) => void;
  categoryFreq: string;
  setCategoryFreq: (freq: string) => void;
  onSubmit: () => void;
}

export function CategoryDialog({
  visible,
  onDismiss,
  colors,
  categoryName,
  setCategoryName,
  categoryCode,
  setCategoryCode,
  categoryDesc,
  setCategoryDesc,
  categoryFreq,
  setCategoryFreq,
  onSubmit
}: CategoryDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
        <Dialog.Title style={{ color: colors.text }}>Create Fee Category</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.inputLabel}>Category Name</ThemedText>
            <TextInput
              placeholder="e.g. Tuition Fee"
              placeholderTextColor={colors.textSecondary}
              value={categoryName}
              onChangeText={setCategoryName}
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
            />

            <ThemedText style={styles.inputLabel}>Unique Code</ThemedText>
            <TextInput
              placeholder="e.g. TUITION"
              placeholderTextColor={colors.textSecondary}
              value={categoryCode}
              onChangeText={setCategoryCode}
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
            />

            <ThemedText style={styles.inputLabel}>Description</ThemedText>
            <TextInput
              placeholder="Enter details..."
              placeholderTextColor={colors.textSecondary}
              value={categoryDesc}
              onChangeText={setCategoryDesc}
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, marginBottom: 10 }]}
            />

            <ThemedText style={styles.inputLabel}>Billing Cycle Frequency</ThemedText>
            <View style={styles.radioGroup}>
              {['monthly', 'quarterly', 'yearly', 'one_time'].map((freq) => (
                <TouchableOpacity key={freq} style={styles.radioOption} onPress={() => setCategoryFreq(freq)}>
                  <RadioButton
                    value={freq}
                    status={categoryFreq === freq ? 'checked' : 'unchecked'}
                    onPress={() => setCategoryFreq(freq)}
                    color="#007AFF"
                    uncheckedColor={colors.textSecondary}
                  />
                  <ThemedText style={{ fontSize: 11, textTransform: 'capitalize' }}>{freq.replace('_', ' ')}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor={colors.textSecondary} onPress={onDismiss}>Cancel</Button>
          <Button textColor="#007AFF" onPress={onSubmit}>Create</Button>
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
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
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
});
