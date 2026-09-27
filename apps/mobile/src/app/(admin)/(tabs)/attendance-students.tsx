import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Portal, Dialog, Button, RadioButton } from 'react-native-paper';
import { DatePickerModal } from '@/components/ui/DatePickerModal';

export default function AttendanceStudentsScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('Select Class');
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [records, setRecords] = useState<any[]>([]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    return { total, present, absent };
  }, [records]);

  // Fetch classes on mount
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await api.get<any>('/classes?mode=min');
        const classesList = Array.isArray(res) 
          ? res 
          : (res && Array.isArray(res.items) ? res.items : []);
        setClasses(classesList);
        if (classesList.length > 0) {
          // select first class by default if none selected
          setSelectedClassId(classesList[0].id);
          setSelectedClassName(`${classesList[0].name}-${classesList[0].section || 'A'}`);
        }
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    }
    loadClasses();
  }, []);

  // Fetch attendance records when class or date changes
  const fetchAttendance = async () => {
    if (!selectedClassId) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    try {
      setIsLoading(true);
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get<any>('/students', {
          params: {
            classId: selectedClassId,
            limit: '1000',
          }
        }),
        api.get<any>('/attendance', {
          params: {
            classId: selectedClassId,
            date: dateStr,
            limit: '1000',
          }
        })
      ]);

      const students = Array.isArray(studentsRes?.items) ? studentsRes.items : [];
      const attendance = Array.isArray(attendanceRes?.records) ? attendanceRes.records : [];

      const statusMap = new Map<string, string>();
      attendance.forEach((a: any) => {
        if (a?.studentId) statusMap.set(a.studentId, a.status);
      });

      const mergedRecords = students.map((s: any) => ({
        studentId: s.id,
        studentName: s.name,
        rollNo: s.rollNumber,
        status: statusMap.get(s.id) || undefined,
      }));

      setRecords(mergedRecords);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch attendance');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedClassId, selectedDate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAttendance();
  };


  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    return records.filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()));
  }, [records, search]);

  return (
    <ThemedView style={styles.container}>
      {/* Filters Section */}
      <View style={[styles.filterBar, { backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity 
          style={[styles.classSelector, { borderColor: colors.backgroundSelected }]} 
          onPress={() => setClassPickerVisible(true)}
        >
          <Ionicons name="school-outline" size={18} color={colors.text} />
          <ThemedText style={styles.classSelectorText} numberOfLines={1}>{selectedClassName}</ThemedText>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.classSelector, { borderColor: colors.backgroundSelected, flex: 0.8, marginLeft: 10, justifyContent: 'center' }]}
          onPress={() => setCalendarVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <ThemedText style={{ fontSize: 13, color: colors.text }}>{format(selectedDate, 'dd-MM-yyyy')}</ThemedText>
        </TouchableOpacity>
      </View>

      {selectedClassId ? (
        <>
          <View style={styles.statsRow}>
            <View style={[styles.miniStat, { backgroundColor: '#34C75920' }]}>
              <ThemedText style={[styles.miniStatVal, { color: '#34C759' }]}>{stats.present}</ThemedText>
              <ThemedText style={styles.miniStatLabel}>Present</ThemedText>
            </View>
            <View style={[styles.miniStat, { backgroundColor: '#FF3B3020' }]}>
              <ThemedText style={[styles.miniStatVal, { color: '#FF3B30' }]}>{stats.absent}</ThemedText>
              <ThemedText style={styles.miniStatLabel}>Absent</ThemedText>
            </View>
            <View style={[styles.miniStat, { backgroundColor: '#007AFF20' }]}>
              <ThemedText style={[styles.miniStatVal, { color: '#007AFF' }]}>{stats.total}</ThemedText>
              <ThemedText style={styles.miniStatLabel}>Total</ThemedText>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={[styles.searchContainer, { backgroundColor: colors.backgroundElement }]}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                placeholder="Search student..."
                placeholderTextColor={colors.textSecondary}
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
          </View>

          {isLoading && !isRefreshing ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            >
              {filteredRecords.map((item) => {
                return (
                  <View key={item.studentId} style={[styles.studentCard, { backgroundColor: colors.backgroundElement }]}>
                    <View style={styles.studentInfo}>
                      <ThemedText style={styles.studentName}>{item.studentName}</ThemedText>
                      <ThemedText style={styles.rollNo}>Roll No: {item.rollNo || 'N/A'}</ThemedText>
                    </View>
                    <View style={styles.btnGroup}>
                      <View style={[
                        styles.statusBadgeObj,
                        { backgroundColor: item.status === 'present' ? '#34C75915' : item.status === 'absent' ? '#FF3B3015' : colors.backgroundSelected }
                      ]}>
                        <ThemedText style={[
                          styles.statusBadgeText,
                          { color: item.status === 'present' ? '#34C759' : item.status === 'absent' ? '#FF3B30' : colors.textSecondary }
                        ]}>
                          {item.status ? item.status.toUpperCase() : 'NOT MARKED'}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
              {filteredRecords.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="people-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No students found.</ThemedText>
                </View>
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.center}>
          <Ionicons name="arrow-up" size={32} color="#007AFF" style={{ marginBottom: 16 }} />
          <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>
            Please select a class to view attendance.
          </ThemedText>
        </View>
      )}

      {/* DatePickerModal for select date */}
      <DatePickerModal
        visible={calendarVisible}
        onDismiss={() => setCalendarVisible(false)}
        onSelectDate={(dateStr) => {
          setSelectedDate(new Date(dateStr));
          setCalendarVisible(false);
        }}
        value={format(selectedDate, 'yyyy-MM-dd')}
        maxDate={format(new Date(), 'yyyy-MM-dd')}
        title="Select Attendance Date"
      />

      {/* Class Picker Modal */}
      <Portal>
        <Dialog visible={classPickerVisible} onDismiss={() => setClassPickerVisible(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400, paddingHorizontal: 0 }}>
            <ScrollView>
              {classes.map((cls) => (
                <TouchableOpacity 
                  key={cls.id} 
                  style={styles.pickerItem} 
                  onPress={() => {
                    setSelectedClassId(cls.id);
                    setSelectedClassName(cls.name);
                    setClassPickerVisible(false);
                  }}
                >
                  <RadioButton.Android
                    value={cls.id}
                    status={selectedClassId === cls.id ? 'checked' : 'unchecked'}
                    onPress={() => {
                      setSelectedClassId(cls.id);
                      setSelectedClassName(cls.name);
                      setClassPickerVisible(false);
                    }}
                    color="#007AFF"
                  />
                  <ThemedText style={{ marginLeft: 8 }}>{cls.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setClassPickerVisible(false)}>Cancel</Button>
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
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  classSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  classSelectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  miniStat: {
    flex: 1,
    minWidth: 96,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  miniStatVal: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  miniStatLabel: {
    fontSize: 10,
    opacity: 0.6,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
  },
  rollNo: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeObj: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});
