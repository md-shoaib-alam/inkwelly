import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Dialog, Portal, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { TICKET_PRIORITY_CONFIG, TICKET_CATEGORY_CONFIG } from './types';

interface CreateTicketDialogProps {
  visible: boolean;
  onDismiss: () => void;
  submitting: boolean;
  colors: any;
  onSubmit: (data: { title: string; description: string; priority: string; category: string }) => void;
}

export function CreateTicketDialog({
  visible,
  onDismiss,
  submitting,
  colors,
  onSubmit,
}: CreateTicketDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');

  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [priorityPickerVisible, setPriorityPickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    });
  };

  return (
    <Portal>
      {/* Main Form Dialog */}
      <Dialog
        visible={visible && !categoryPickerVisible && !priorityPickerVisible}
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
      >
        <Dialog.Title style={{ color: colors.text }}>Create Support Ticket</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Ticket Title</ThemedText>
            <TextInput
              placeholder="Brief summary of the issue..."
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
            />

            <ThemedText style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Category</ThemedText>
            <TouchableOpacity
              style={[styles.selectTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
              onPress={() => setCategoryPickerVisible(true)}
            >
              <View style={styles.triggerValueRow}>
                <Ionicons 
                  name={TICKET_CATEGORY_CONFIG[category]?.icon as any || 'help-circle-outline'} 
                  size={16} 
                  color="#007AFF" 
                  style={{ marginRight: 8 }} 
                />
                <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
                  {TICKET_CATEGORY_CONFIG[category]?.label || category}
                </ThemedText>
              </View>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <ThemedText style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Priority</ThemedText>
            <TouchableOpacity
              style={[styles.selectTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
              onPress={() => setPriorityPickerVisible(true)}
            >
              <View style={styles.triggerValueRow}>
                <View 
                  style={[
                    styles.priorityDot, 
                    { backgroundColor: TICKET_PRIORITY_CONFIG[priority]?.color || '#8E8E93' }
                  ]} 
                />
                <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' }}>
                  {TICKET_PRIORITY_CONFIG[priority]?.label || priority}
                </ThemedText>
              </View>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <ThemedText style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Description</ThemedText>
            <TextInput
              placeholder="Describe the problem in detail so our support staff can help..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textarea, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
            />

          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Button textColor={colors.textSecondary} onPress={onDismiss}>Cancel</Button>
          <Button
            mode="contained"
            buttonColor="#007AFF"
            textColor="#FFFFFF"
            disabled={submitting || !title.trim() || !description.trim()}
            loading={submitting}
            onPress={handleSubmit}
            style={{ borderRadius: 10, marginLeft: 8 }}
          >
            Submit
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Category Picker Dialog */}
      <Dialog
        visible={visible && categoryPickerVisible}
        onDismiss={() => setCategoryPickerVisible(false)}
        style={{ backgroundColor: colors.backgroundElement }}
      >
        <Dialog.Title style={{ color: colors.text }}>Select Category</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          <ScrollView>
            {Object.entries(TICKET_CATEGORY_CONFIG).map(([key, cfg]) => (
              <TouchableOpacity
                key={key}
                style={styles.pickerItem}
                onPress={() => {
                  setCategory(key);
                  setCategoryPickerVisible(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={cfg.icon as any} size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <ThemedText style={{ color: colors.text }}>{cfg.label}</ThemedText>
                </View>
                {category === key && <Ionicons name="checkmark" size={18} color="#007AFF" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor="#007AFF" onPress={() => setCategoryPickerVisible(false)}>Back</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Priority Picker Dialog */}
      <Dialog
        visible={visible && priorityPickerVisible}
        onDismiss={() => setPriorityPickerVisible(false)}
        style={{ backgroundColor: colors.backgroundElement }}
      >
        <Dialog.Title style={{ color: colors.text }}>Select Priority</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
          <ScrollView>
            {Object.entries(TICKET_PRIORITY_CONFIG).map(([key, cfg]) => (
              <TouchableOpacity
                key={key}
                style={styles.pickerItem}
                onPress={() => {
                  setPriority(key);
                  setPriorityPickerVisible(false);
                }}
              >
                <ThemedText style={{ color: cfg.color, fontWeight: '700' }}>
                  {cfg.label.toUpperCase()}
                </ThemedText>
                {priority === key && <Ionicons name="checkmark" size={18} color="#007AFF" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button textColor="#007AFF" onPress={() => setPriorityPickerVisible(false)}>Back</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 4,
  },
  textarea: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  selectTrigger: {
    borderWidth: 1,
    borderRadius: 10,
    height: 46,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  triggerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
});
