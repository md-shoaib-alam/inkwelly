import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { ClassSelector } from '@/components/admin/ClassSelector';
import { EmptyTimetableState } from '@/components/timetable/EmptyTimetableState';
import { Skeleton } from '@/components/Skeleton';

// Subcomponents
import { TimetableSlot, DAYS } from '@/components/admin/timetable/types';
import { TimetableSlotCard } from '@/components/admin/timetable/TimetableSlotCard';
import { AddPeriodDialog } from '@/components/admin/timetable/AddPeriodDialog';

export default function TimetableScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const jsDay = new Date().getDay();
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    return dayMap[jsDay];
  });
  const [classFilter, setClassFilter] = useState<string>('');
  const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);

  // Fetch tenant settings for working days
  useEffect(() => {
    async function loadTenantSettings() {
      try {
        const res = await api.get<any>('/tenant-settings');
        const wDays = res?.settings?.workingDays;
        if (Array.isArray(wDays)) {
          setWorkingDays(wDays);
          
          const jsDay = new Date().getDay();
          const dayMap: Record<number, string> = {
            0: 'sunday',
            1: 'monday',
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: 'saturday',
          };
          const todayKey = dayMap[jsDay];
          if (wDays.includes(todayKey)) {
            setSelectedDay(todayKey);
          } else if (wDays.length > 0) {
            setSelectedDay(wDays[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load tenant settings for working days:', err);
      }
    }
    loadTenantSettings();
  }, []);
  
  // Data lists for Form selectors
  const [subjects, setSubjects] = useState<{ id: string; name: string; classId?: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; section: string }[]>([]);

  // Form states
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input fields
  const [formType, setFormType] = useState<'academic' | 'break'>('academic');
  const [formDay, setFormDay] = useState('monday');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formClassId, setFormClassId] = useState('');

  // Deletion Confirmation States
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);

  // Error States
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isTeacher = user?.role === 'teacher';
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canCreate = isAdmin;

  // Fetch classes for admin/teacher filters
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await api.get<any>('/classes?mode=min');
        const classList = Array.isArray(res) 
          ? res 
          : (res && Array.isArray(res.items) ? res.items : []);
        setClasses(classList);
      } catch (err) {
        console.error('Failed to load initial class list:', err);
      }
    }
    if (isAdmin || isTeacher) {
      loadInitialData();
    }
  }, [isAdmin, isTeacher]);

  // Fetch subjects and teachers for form selectors
  useEffect(() => {
    async function loadFormSelectors() {
      try {
        const subList = await api.get<any>('/subjects', { params: { mode: 'min' } });
        const teachList = await api.get<any>('/teachers', { params: { mode: 'min' } });
        setSubjects(subList);
        setTeachers(teachList);
      } catch (err) {
        console.error('Failed to fetch subjects/teachers for forms:', err);
      }
    }
    if (dialogVisible) {
      loadFormSelectors();
    }
  }, [dialogVisible]);

  // Set default form day to selected tab day
  useEffect(() => {
    if (dialogVisible && dialogMode === 'create') {
      setFormDay(selectedDay);
      if (isAdmin && classFilter) {
        setFormClassId(classFilter);
      }
    }
  }, [dialogVisible, dialogMode, selectedDay, classFilter, isAdmin]);

  // Fetch timetable slots based on filter
  const fetchTimetable = useCallback(async () => {
    if (isAdmin && !classFilter) {
      setSlots([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const startTime = Date.now();
      const params: Record<string, any> = {};
      if (classFilter) {
        params.classId = classFilter;
      }
      if (isTeacher) {
        params.mine = 'true';
      }

      const res = await api.get<any>('/timetable', { params });
      setSlots(res);

      const elapsed = Date.now() - startTime;
      const minDuration = 400;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [classFilter, isAdmin, isTeacher]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTimetable();
  };

  // Open creation dialog
  const handleOpenCreate = () => {
    setDialogMode('create');
    setEditingSlot(null);
    setFormType('academic');
    setFormStartTime('08:00');
    setFormEndTime('09:00');
    setFormSubjectId('');
    setFormTeacherId('');
    setFormLabel('');
    setFormClassId(classFilter || (classes.length > 0 ? classes[0].id : ''));
    setDialogVisible(true);
  };

  // Open edit dialog
  const handleOpenEdit = (slot: TimetableSlot) => {
    setDialogMode('edit');
    setEditingSlot(slot);
    setFormType(slot.label ? 'break' : 'academic');
    setFormDay(slot.day);
    setFormStartTime(slot.startTime);
    setFormEndTime(slot.endTime);
    setFormSubjectId(slot.subjectId || '');
    setFormTeacherId(slot.teacherId || '');
    setFormLabel(slot.label || '');
    setFormClassId(classFilter);
    setDialogVisible(true);
  };

  // Delete a slot
  const handleDeleteClick = (id: string) => {
    setSlotToDelete(id);
    setDeleteConfirmVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/timetable?id=${id}`);
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setErrorMsg('Failed to delete timetable slot.');
      setErrorVisible(true);
    }
  };

  // Submit Form
  const handleSubmit = async () => {
    if (!formClassId) {
      setErrorMsg('Please select a class.');
      setErrorVisible(true);
      return;
    }
    if (!formStartTime || !formEndTime) {
      setErrorMsg('Start time and End time are required.');
      setErrorVisible(true);
      return;
    }
    if (formType === 'academic' && (!formSubjectId || !formTeacherId)) {
      setErrorMsg('Please select a Subject and Teacher.');
      setErrorVisible(true);
      return;
    }
    if (formType === 'break' && !formLabel.trim()) {
      setErrorMsg('Please enter a label for the break (e.g. Lunch).');
      setErrorVisible(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        id: editingSlot?.id,
        classId: formClassId,
        day: formDay,
        startTime: formStartTime,
        endTime: formEndTime,
        subjectId: formType === 'academic' ? formSubjectId : null,
        teacherId: formType === 'academic' ? formTeacherId : null,
        label: formType === 'break' ? formLabel : null,
      };

      if (dialogMode === 'create') {
        await api.post('/timetable', {
          classId: formClassId,
          slots: [payload]
        });
      } else {
        await api.put('/timetable', payload);
      }

      setDialogVisible(false);
      fetchTimetable();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save timetable slot.');
      setErrorVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter slots for the active day tab
  const activeDaySlots = useMemo(() => {
    return slots
      .filter(s => s.day.toLowerCase() === selectedDay.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, selectedDay]);

  const flashListRef = React.useRef<any>(null);

  const currentSlotIndex = useMemo(() => {
    const jsDay = new Date().getDay();
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    const todayStr = dayMap[jsDay].toLowerCase();
    
    if (selectedDay.toLowerCase() !== todayStr) return -1;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return activeDaySlots.findIndex(slot => {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
  }, [activeDaySlots, selectedDay]);

  useEffect(() => {
    if (currentSlotIndex !== -1 && activeDaySlots.length > 0) {
      const timer = setTimeout(() => {
        try {
          flashListRef.current?.scrollToIndex({
            index: currentSlotIndex,
            animated: true,
            viewPosition: 0.3
          });
        } catch (e) {
          console.warn('Scroll to current period failed:', e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentSlotIndex, activeDaySlots]);

  const filteredDays = useMemo(() => {
    return DAYS.filter(d => workingDays.includes(d.key.toLowerCase()));
  }, [workingDays]);

  const dayTabsScrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    if (filteredDays.length > 0 && selectedDay) {
      const index = filteredDays.findIndex(d => d.key.toLowerCase() === selectedDay.toLowerCase());
      if (index !== -1) {
        // Approximate width: Mon/Tue/Wed buttons are about 68-74px plus gap 8px
        const approxTabWidth = 72;
        const gap = 8;
        const offset = Math.max(0, index * (approxTabWidth + gap) - 100);
        const timer = setTimeout(() => {
          dayTabsScrollRef.current?.scrollTo({ x: offset, y: 0, animated: true });
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedDay, filteredDays]);

  const showClassPicker = isAdmin && !classFilter;

  return (
    <ThemedView style={styles.container}>
      {/* Header section with title and class selectors */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
        {isAdmin && classes.length > 0 && (
          <View style={styles.titleRow}>
            <View style={{ width: 150 }}>
              <ClassSelector 
                value={classFilter} 
                onValueChange={(val) => setClassFilter(val)} 
              />
            </View>
          </View>
        )}

        {/* Horizontal Day Tabs */}
        <ScrollView 
          ref={dayTabsScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabsContainer}
        >
          {filteredDays.map(day => {
            const isActive = selectedDay === day.key;
            return (
              <TouchableOpacity
                key={day.key}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: '#007AFF', borderColor: '#007AFF' },
                  !isActive && { borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }
                ]}
                onPress={() => setSelectedDay(day.key)}
              >
                <ThemedText style={[styles.tabText, { color: isActive ? '#FFF' : colors.text }]}>
                  {day.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List or Grid Selector */}
      {showClassPicker ? (
        <EmptyTimetableState 
          selectedClass={classFilter}
          classes={classes}
          onClassSelect={(id) => setClassFilter(id)}
          isTeacher={isTeacher}
        />
      ) : isLoading ? (
        <ScrollView 
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
        >
          {[1, 2, 3, 4].map(i => (
            <View 
              key={i} 
              style={{ 
                flexDirection: 'row',
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                backgroundColor: colors.backgroundElement,
                borderWidth: 1,
                borderColor: colors.backgroundSelected,
                height: 86,
                alignItems: 'center'
              }}
            >
              <View style={{ width: 60, gap: 4, alignItems: 'center' }}>
                <Skeleton width={45} height={12} />
                <Skeleton width={10} height={10} />
                <Skeleton width={45} height={12} />
              </View>
              <View style={{ width: 1, height: '100%', backgroundColor: colors.backgroundSelected, marginHorizontal: 16 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlashList
          ref={flashListRef}
          data={activeDaySlots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
          ListEmptyComponent={
            <EmptyTimetableState 
              selectedClass={classFilter}
              classes={classes}
              onClassSelect={(id) => setClassFilter(id)}
              isTeacher={isTeacher}
            />
          }
          renderItem={({ item }) => (
            <TimetableSlotCard
              item={item}
              colors={colors}
              isAdmin={isAdmin}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDeleteClick(item.id)}
            />
          )}
        />
      )}

      {/* FAB to add new slots */}
      {canCreate && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleOpenCreate}
          color="#FFF"
        />
      )}

      {/* CRUD dialog */}
      <AddPeriodDialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        colors={colors}
        dialogMode={dialogMode}
        editingSlot={editingSlot}
        formType={formType}
        setFormType={setFormType}
        formDay={formDay}
        setFormDay={setFormDay}
        formStartTime={formStartTime}
        setFormStartTime={setFormStartTime}
        formEndTime={formEndTime}
        setFormEndTime={setFormEndTime}
        formSubjectId={formSubjectId}
        setFormSubjectId={setFormSubjectId}
        formTeacherId={formTeacherId}
        setFormTeacherId={setFormTeacherId}
        formLabel={formLabel}
        setFormLabel={setFormLabel}
        formClassId={formClassId}
        setFormClassId={setFormClassId}
        subjects={subjects}
        teachers={teachers}
        classes={classes}
        filteredDays={filteredDays}
        isAdmin={isAdmin}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      {/* PORTALS FOR DROPDOWN MODALS */}
      <Portal>
        {/* Delete Confirmation Alert */}
        <Dialog visible={deleteConfirmVisible} onDismiss={() => setDeleteConfirmVisible(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Delete Slot</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text }}>Are you sure you want to delete this timetable slot?</ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setDeleteConfirmVisible(false)}>Cancel</Button>
            <Button buttonColor="#FF3B30" textColor="#FFF" onPress={async () => {
              if (slotToDelete) {
                await handleDelete(slotToDelete);
                setDeleteConfirmVisible(false);
              }
            }}>Delete</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Error Alert */}
        <Dialog visible={errorVisible} onDismiss={() => setErrorVisible(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: '#FF3B30' }}>Error</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text }}>{errorMsg}</ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setErrorVisible(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  tabsContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#007AFF',
    borderRadius: 28,
  },
});
