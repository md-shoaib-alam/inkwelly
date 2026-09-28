import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Portal, Dialog, Button, RadioButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { TimetableSlot } from './types';
import { TimePickerModal } from '@/components/ui/TimePickerModal';

interface AddPeriodDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  dialogMode: 'create' | 'edit';
  editingSlot: TimetableSlot | null;
  formType: 'academic' | 'break';
  setFormType: (val: 'academic' | 'break') => void;
  formDay: string;
  setFormDay: (val: string) => void;
  formStartTime: string;
  setFormStartTime: (val: string) => void;
  formEndTime: string;
  setFormEndTime: (val: string) => void;
  formSubjectId: string;
  setFormSubjectId: (val: string) => void;
  formTeacherId: string;
  setFormTeacherId: (val: string) => void;
  formLabel: string;
  setFormLabel: (val: string) => void;
  formClassId: string;
  setFormClassId: (val: string) => void;
  subjects: { id: string; name: string; classId?: string }[];
  teachers: { id: string; name: string }[];
  classes: { id: string; name: string; section: string }[];
  filteredDays: { key: string; label: string }[];
  isAdmin: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function AddPeriodDialog({
  visible,
  onDismiss,
  colors,
  dialogMode,
  editingSlot,
  formType,
  setFormType,
  formDay,
  setFormDay,
  formStartTime,
  setFormStartTime,
  formEndTime,
  setFormEndTime,
  formSubjectId,
  setFormSubjectId,
  formTeacherId,
  setFormTeacherId,
  formLabel,
  setFormLabel,
  formClassId,
  setFormClassId,
  subjects,
  teachers,
  classes,
  filteredDays,
  isAdmin,
  isSubmitting,
  onSubmit,
}: AddPeriodDialogProps) {
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [teacherPickerVisible, setTeacherPickerVisible] = useState(false);
  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);

  const [animation] = useState(new Animated.Value(formType === 'academic' ? 0 : 1));
  const [containerWidth, setContainerWidth] = useState(0);

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: formType === 'academic' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [formType]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [3, (containerWidth / 2) - 3],
  });

  const animatedBg = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#007AFF', '#FF9500'],
  });

  const selectedSubjectName = subjects.find(s => s.id === formSubjectId)?.name || 'Select Subject';
  const selectedTeacherName = teachers.find(t => t.id === formTeacherId)?.name || 'Select Teacher';
  const selectedClassName = classes.find(c => c.id === formClassId) 
    ? `${classes.find(c => c.id === formClassId)?.name} - ${classes.find(c => c.id === formClassId)?.section}`
    : 'Select Class';

  const formatTime12 = (time24: string) => {
    if (!time24) return '--:--';
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${String(h12).padStart(2, '0')}:${mStr} ${ampm}`;
  };

  const filteredSubjects = React.useMemo(() => {
    if (!formClassId) return subjects;
    return subjects.filter(s => !s.classId || s.classId === formClassId);
  }, [subjects, formClassId]);

  return (
    <>
      <Portal>
        <Dialog 
          visible={visible} 
          onDismiss={onDismiss}
          style={{ backgroundColor: colors.backgroundElement, maxHeight: '85%' }}
        >
          <Dialog.Title style={{ color: colors.text }}>
            {dialogMode === 'create' ? 'Add Timetable Slot' : 'Edit Timetable Slot'}
          </Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected }}>
            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              
              {/* Type Switcher */}
              <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Slot Type</ThemedText>
              <View 
                style={[
                  styles.typeSwitcher, 
                  { 
                    backgroundColor: colors.backgroundSelected, 
                    marginTop: 6 
                  }
                ]}
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
              >
                {containerWidth > 0 && (
                  <Animated.View 
                    style={[
                      styles.sliderOverlay, 
                      { 
                        width: (containerWidth / 2) - 3, 
                        transform: [{ translateX }],
                        backgroundColor: animatedBg
                      }
                    ]} 
                  />
                )}
                <TouchableOpacity 
                  style={styles.typeBtn}
                  onPress={() => setFormType('academic')}
                  activeOpacity={0.8}
                >
                  <ThemedText style={{ color: formType === 'academic' ? '#FFF' : colors.text, fontWeight: '600' }}>Academic Period</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.typeBtn}
                  onPress={() => setFormType('break')}
                  activeOpacity={0.8}
                >
                  <ThemedText style={{ color: formType === 'break' ? '#FFF' : colors.text, fontWeight: '600' }}>Break / Recess</ThemedText>
                </TouchableOpacity>
              </View>

              {/* Day Selector trigger */}
              <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Day</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected }]} 
                onPress={() => setDayPickerVisible(true)}
              >
                <ThemedText style={{ color: colors.text }}>
                  {filteredDays.find(d => d.key === formDay)?.label || 'Select Day'}
                </ThemedText>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Class Selector trigger (Admin only) */}
              {isAdmin && (
                <>
                  <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Class</ThemedText>
                  <TouchableOpacity 
                    style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected }]} 
                    onPress={() => setClassPickerVisible(true)}
                  >
                    <ThemedText style={{ color: colors.text }}>{selectedClassName}</ThemedText>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Start Time</ThemedText>
                  <TouchableOpacity 
                    style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, marginTop: 4 }]} 
                    onPress={() => setStartTimePickerVisible(true)}
                  >
                    <ThemedText style={{ color: colors.text }}>{formatTime12(formStartTime) || '08:00 AM'}</ThemedText>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>End Time</ThemedText>
                  <TouchableOpacity 
                    style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected, marginTop: 4 }]} 
                    onPress={() => setEndTimePickerVisible(true)}
                  >
                    <ThemedText style={{ color: colors.text }}>{formatTime12(formEndTime) || '09:00 AM'}</ThemedText>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {formType === 'academic' ? (
                <>
                  {/* Subject selector */}
                  <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Subject</ThemedText>
                  <TouchableOpacity 
                    style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected }]} 
                    onPress={() => setSubjectPickerVisible(true)}
                  >
                    <ThemedText style={{ color: colors.text }}>{selectedSubjectName}</ThemedText>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Teacher selector */}
                  <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Teacher</ThemedText>
                  <TouchableOpacity 
                    style={[styles.pickerTrigger, { borderColor: colors.backgroundSelected }]} 
                    onPress={() => setTeacherPickerVisible(true)}
                  >
                    <ThemedText style={{ color: colors.text }}>{selectedTeacherName}</ThemedText>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Break Custom Label */}
                  <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Break Label</ThemedText>
                  <TextInput
                    value={formLabel}
                    onChangeText={setFormLabel}
                    placeholder="e.g. Recess, Lunch Break"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.textInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
                  />
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ gap: 10, paddingBottom: 16, paddingHorizontal: 16 }}>
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
              textColor="#FFF" 
              buttonColor={formType === 'academic' ? '#007AFF' : '#FF9500'} 
              loading={isSubmitting} 
              style={{ borderRadius: 20, minWidth: 100 }}
              labelStyle={{ fontWeight: '700' }}
              onPress={onSubmit}
            >
              {dialogMode === 'create' ? 'Save' : 'Update'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Day Picker */}
        <Dialog visible={dayPickerVisible} onDismiss={() => setDayPickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, maxHeight: '60%' }}>
          <Dialog.Title style={{ color: colors.text }}>Select Day</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group onValueChange={val => { setFormDay(val); setDayPickerVisible(false); }} value={formDay}>
                {filteredDays.map(d => (
                  <RadioButton.Item key={d.key} label={d.label} value={d.key} labelStyle={{ color: colors.text }} color="#007AFF" />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>

        {/* Class Picker */}
        <Dialog visible={classPickerVisible} onDismiss={() => setClassPickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, maxHeight: '60%' }}>
          <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group onValueChange={val => { setFormClassId(val); setClassPickerVisible(false); }} value={formClassId}>
                {classes.map(c => (
                  <RadioButton.Item key={c.id} label={`${c.name} - ${c.section}`} value={c.id} labelStyle={{ color: colors.text }} color="#007AFF" />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>

        {/* Subject Picker */}
        <Dialog visible={subjectPickerVisible} onDismiss={() => setSubjectPickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, maxHeight: '60%' }}>
          <Dialog.Title style={{ color: colors.text }}>Select Subject</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group onValueChange={val => { setFormSubjectId(val); setSubjectPickerVisible(false); }} value={formSubjectId}>
                {filteredSubjects.map(s => (
                  <RadioButton.Item key={s.id} label={s.name} value={s.id} labelStyle={{ color: colors.text }} color="#007AFF" />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>

        {/* Teacher Picker */}
        <Dialog visible={teacherPickerVisible} onDismiss={() => setTeacherPickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, maxHeight: '60%' }}>
          <Dialog.Title style={{ color: colors.text }}>Select Teacher</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group onValueChange={val => { setFormTeacherId(val); setTeacherPickerVisible(false); }} value={formTeacherId}>
                {teachers.map(t => (
                  <RadioButton.Item key={t.id} label={t.name} value={t.id} labelStyle={{ color: colors.text }} color="#007AFF" />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>

      {/* Time Picker Modals */}
      <TimePickerModal
        visible={startTimePickerVisible}
        onDismiss={() => setStartTimePickerVisible(false)}
        onSelectTime={(time) => setFormStartTime(time)}
        value={formStartTime}
        title="Select Start Time"
      />

      <TimePickerModal
        visible={endTimePickerVisible}
        onDismiss={() => setEndTimePickerVisible(false)}
        onSelectTime={(time) => setFormEndTime(time)}
        value={formEndTime}
        title="Select End Time"
      />
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
  typeSwitcher: {
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
    height: 44,
    alignItems: 'center',
    position: 'relative',
    padding: 3,
  },
  typeBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  sliderOverlay: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 21,
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
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});
