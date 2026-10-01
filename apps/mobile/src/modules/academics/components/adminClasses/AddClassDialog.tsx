import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { TeacherInfo } from './types';

interface AddClassDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  activeTheme: string;
  dialogMode: 'create' | 'edit';
  section: string;
  setSection: (val: string) => void;
  classLevel: string;
  setClassLevel: (val: string) => void;
  capacity: string;
  setCapacity: (val: string) => void;
  classTeacherId: string;
  setClassTeacherId: (val: string) => void;
  teachers: TeacherInfo[];
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function AddClassDialog({
  visible,
  onDismiss,
  colors,
  activeTheme,
  dialogMode,
  section,
  setSection,
  classLevel,
  setClassLevel,
  capacity,
  setCapacity,
  classTeacherId,
  setClassTeacherId,
  teachers,
  isSubmitting,
  onSubmit,
}: AddClassDialogProps) {
  const { width } = useWindowDimensions();
  const isSmallDevice = width <= 375; // Fits standard small devices like iPhone SE (375px or less)

  const [teacherPickerVisible, setTeacherPickerVisible] = useState(false);
  const [sectionPickerVisible, setSectionPickerVisible] = useState(false);
  const [classLevelPickerVisible, setClassLevelPickerVisible] = useState(false);

  const getSelectedTeacherName = () => {
    if (!classTeacherId) return 'Select Class Teacher';
    const teacher = teachers.find(t => t.id === classTeacherId);
    return teacher ? teacher.name : 'Select Class Teacher';
  };

  return (
    <>
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={() => !isSubmitting && onDismiss()}
          style={[styles.premiumDialog, { backgroundColor: colors.backgroundElement }]}
        >
          {/* Custom Header */}
          <View style={styles.dialogCustomHeader}>
            <View style={{ flex: 1, alignItems: 'center', paddingLeft: 24 }}>
              <ThemedText style={{ color: colors.text, fontWeight: 'bold', fontSize: 18 }}>
                {dialogMode === 'create' ? 'Add Class' : 'Edit Class'}
              </ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                {dialogMode === 'create' ? 'Create a new class section' : 'Update class details'}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={onDismiss} style={styles.dialogCloseBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              {/* Row for Class Level and Section side by side. There is no name field:
                  the server derives the class name from the level. */}
              <View style={{ flexDirection: isSmallDevice ? 'column' : 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: isSmallDevice ? undefined : 1 }}>
                  <View style={styles.labelWithIcon}>
                    <Ionicons name="school-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Class level *</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
                    onPress={() => setClassLevelPickerVisible(true)}
                  >
                    <ThemedText style={{ color: classLevel ? colors.text : colors.textSecondary, fontSize: 14 }} numberOfLines={1}>
                      {classLevel ? (isNaN(Number(classLevel)) ? classLevel : `Class ${classLevel}`) : 'Select class level'}
                    </ThemedText>
                    <Ionicons name="chevron-down-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: isSmallDevice ? undefined : 1 }}>
                  <View style={styles.labelWithIcon}>
                    <Ionicons name="layers-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Section *</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
                    onPress={() => setSectionPickerVisible(true)}
                  >
                    <ThemedText style={{ color: section ? colors.text : colors.textSecondary, fontSize: 14 }} numberOfLines={1}>
                      {section ? `Section ${section}` : 'Select Section'}
                    </ThemedText>
                    <Ionicons name="chevron-down-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <View style={styles.labelWithIcon}>
                  <Ionicons name="people-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Capacity *</ThemedText>
                </View>
                <TextInput
                  placeholder="40"
                  placeholderTextColor={colors.textSecondary}
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="numeric"
                  style={[styles.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <View style={styles.labelWithIcon}>
                  <Ionicons name="person-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Class Teacher</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
                  onPress={() => setTeacherPickerVisible(true)}
                >
                  <ThemedText style={{ color: classTeacherId ? colors.text : colors.textSecondary, fontSize: 14 }}>
                    {getSelectedTeacherName()}
                  </ThemedText>
                  <Ionicons name="chevron-down-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Stacked Action Buttons */}
              <View style={{ gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: '#10B981' }]}
                  onPress={onSubmit}
                  disabled={isSubmitting}
                >
                  <ThemedText style={styles.modalSubmitBtnText}>
                    {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: colors.backgroundSelected, backgroundColor: activeTheme === 'dark' ? '#27272A' : '#F9FAFB' }]}
                  onPress={onDismiss}
                >
                  <ThemedText style={[styles.modalCancelBtnText, { color: colors.text }]}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>

        {/* Teacher Selector Sub-Dialog */}
        <Dialog
          visible={teacherPickerVisible}
          onDismiss={() => setTeacherPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Class Teacher</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0, maxHeight: 350 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}>
              <TouchableOpacity
                style={[styles.pickerRow, { borderColor: colors.backgroundSelected }]}
                onPress={() => {
                  setClassTeacherId('');
                  setTeacherPickerVisible(false);
                }}
              >
                <ThemedText style={{ fontWeight: '500', fontSize: 14, color: '#EF4444' }}>Unassign / No Teacher</ThemedText>
              </TouchableOpacity>
              {teachers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.pickerRow, { borderColor: colors.backgroundSelected }]}
                  onPress={() => {
                    setClassTeacherId(item.id);
                    setTeacherPickerVisible(false);
                  }}
                >
                  <ThemedText style={{ fontWeight: '500', fontSize: 14, color: colors.text }}>{item.name}</ThemedText>
                  {classTeacherId === item.id && (
                    <Ionicons name="checkmark" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setTeacherPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Section Selector Dialog */}
        <Dialog
          visible={sectionPickerVisible}
          onDismiss={() => setSectionPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Section</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0, maxHeight: 350 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}>
              {["A", "B", "C", "D"].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.pickerRow, { borderColor: colors.backgroundSelected }]}
                  onPress={() => {
                    setSection(item);
                    setSectionPickerVisible(false);
                  }}
                >
                  <ThemedText style={{ fontWeight: '500', fontSize: 14, color: colors.text }}>Section {item}</ThemedText>
                  {section === item && (
                    <Ionicons name="checkmark" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setSectionPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Class Level Selector Dialog */}
        <Dialog
          visible={classLevelPickerVisible}
          onDismiss={() => setClassLevelPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Class Level</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0, maxHeight: 350 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}>
              {[
                "Pre-Nursery", "Nursery", "LKG", "UKG",
                "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.pickerRow, { borderColor: colors.backgroundSelected }]}
                  onPress={() => {
                    setClassLevel(item);
                    setClassLevelPickerVisible(false);
                  }}
                >
                  <ThemedText style={{ fontWeight: '500', fontSize: 14, color: colors.text }}>
                    {isNaN(Number(item)) ? item : `Class ${item}`}
                  </ThemedText>
                  {classLevel === item && (
                    <Ionicons name="checkmark" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setClassLevelPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  premiumDialog: {
    maxHeight: '90%',
    borderRadius: 20,
  },
  dialogCustomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dialogCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalSubmitBtn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalCancelBtn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
});
