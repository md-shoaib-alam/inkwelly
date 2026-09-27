import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { Skeleton } from '@/components/Skeleton';
import { format } from 'date-fns';

const TypedFlashList = FlashList as any;

interface StaffInfo {
  id: string;
  name: string;
  role: string;
  customRole?: { name: string };
}

export default function AttendanceStaffScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const getLocalDateString = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

  const [date, setDate] = useState(() => getLocalDateString(new Date()));
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({});
  const [serverMap, setServerMap] = useState<Record<string, 'present' | 'absent'>>({});
  const [hasExistingRegistry, setHasExistingRegistry] = useState(false);
  const [markedMonthsData, setMarkedMonthsData] = useState<Record<string, Record<string, boolean>>>({});
  const [visibleMonthStr, setVisibleMonthStr] = useState(() => date.slice(0, 7));
  const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);

  useEffect(() => {
    setVisibleMonthStr(date.slice(0, 7));
  }, [date]);

  const getDayName = (day: Date) => {
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    return dayMap[day.getDay()];
  };

  const fetchMonthAttendanceStatus = useCallback(async () => {
    if (!visibleMonthStr) return;
    const monthKey = visibleMonthStr;
    try {
      const res = await api.get<any>(`/staff-attendance?month=${monthKey}`);
      const records = Array.isArray(res) ? res : res?.data ?? [];
      const markedDatesMap: Record<string, boolean> = {};
      records.forEach((rec: any) => {
        if (rec.date && rec.userRole === 'staff') {
          markedDatesMap[rec.date] = true;
        }
      });
      setMarkedMonthsData(prev => ({
        ...prev,
        [monthKey]: markedDatesMap
      }));
    } catch (err) {
      console.error('Failed to fetch month attendance status:', err);
    }
  }, [visibleMonthStr]);

  useEffect(() => {
    fetchMonthAttendanceStatus();
  }, [visibleMonthStr, fetchMonthAttendanceStatus]);

  const loadRegistry = useCallback(async () => {
    try {
      setLoading(true);
      const [resStaff, resAttendance, resSettings] = await Promise.all([
        api.get<any>('/staff?mode=min'),
        api.get<any>(`/staff-attendance?date=${date}`),
        api.get<any>('/tenant-settings').catch(() => null)
      ]);

      const list = Array.isArray(resStaff) ? resStaff : resStaff.items ?? [];
      setStaffList(list);

      const records = Array.isArray(resAttendance) ? resAttendance : resAttendance?.data ?? [];
      setHasExistingRegistry(records.length > 0);

      const initialMap: Record<string, 'present' | 'absent'> = {};
      list.forEach((s: StaffInfo) => {
        initialMap[s.id] = 'absent'; // Staff default is absent
      });

      records.forEach((rec: any) => {
        if (rec.userId && (rec.status === 'present' || rec.status === 'absent')) {
          initialMap[rec.userId] = rec.status;
        }
      });

      const wDays = resSettings?.settings?.workingDays;
      if (Array.isArray(wDays)) {
        setWorkingDays(wDays);
      }

      setAttendanceMap(initialMap);
      setServerMap(initialMap);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load attendance details.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadRegistry();
    await fetchMonthAttendanceStatus();
    setIsRefreshing(false);
  }, [loadRegistry, fetchMonthAttendanceStatus]);

  const handleToggle = (id: string, status: 'present' | 'absent') => {
    setAttendanceMap(prev => ({ ...prev, [id]: status }));
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    const nextMap: Record<string, 'present' | 'absent'> = {};
    filteredStaff.forEach(s => {
      nextMap[s.id] = status;
    });
    setAttendanceMap(prev => ({ ...prev, ...nextMap }));
  };

  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(attendanceMap).some(id => attendanceMap[id] !== serverMap[id]);
  }, [attendanceMap, serverMap]);

  const canSave = hasUnsavedChanges || !hasExistingRegistry;

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const updates = Object.keys(attendanceMap).map(userId => ({
        userId,
        status: attendanceMap[userId],
        checkIn: attendanceMap[userId] === 'present' ? '09:00 AM' : undefined,
      }));

      await api.post('/staff-attendance', {
        date,
        records: updates
      });

      setSuccessVisible(true);
      setServerMap(attendanceMap);
      loadRegistry();
      fetchMonthAttendanceStatus();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save attendance registry.');
    } finally {
      setSubmitting(false);
    }
  };

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    if (!visibleMonthStr) return marked;
    
    const [year, month] = visibleMonthStr.split('-').map(Number);
    const todayStr = getLocalDateString(new Date());
    
    for (let m = month - 1; m <= month + 1; m++) {
      const targetMonth = (m + 11) % 12;
      const targetYear = year + Math.floor((m - 1) / 12);
      
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(targetYear, targetMonth, d);
        const dateString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const dayName = getDayName(dateObj);
        const isWorkday = workingDays.includes(dayName);
        
        const isFuture = dateString > todayStr;
        
        if (!isWorkday || isFuture) {
          marked[dateString] = {
            disabled: true,
            disableTouchEvent: true,
            textColor: colors.textSecondary + '40',
          };
        } else {
          const monthStr = dateString.slice(0, 7);
          const monthData = markedMonthsData[monthStr];
          if (!monthData) {
            // Unloaded adjacent dates should NOT show any orange or green dots
            continue;
          }
          const isMarked = monthData[dateString];
          if (isMarked) {
            marked[dateString] = {
              marked: true,
              dotColor: '#34C759',
            };
          } else {
            // Unmarked workday has orange dot to alert admin to fill it!
            marked[dateString] = {
              marked: true,
              dotColor: '#FF9500',
            };
          }
        }
      }
    }
    
    if (date) {
      marked[date] = {
        ...marked[date],
        selected: true,
        selectedColor: '#007AFF',
      };
    }
    
    return marked;
  }, [visibleMonthStr, date, workingDays, colors, markedMonthsData]);

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [staffList, search]);

  const presentCount = Object.values(attendanceMap).filter(v => v === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'absent').length;

  return (
    <ThemedView style={styles.container}>
      {/* Selection row */}
      <View style={[styles.filterBar, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.backgroundSelected }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
          <Ionicons name="search" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search staff members..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <TouchableOpacity 
          style={[styles.dateDropdown, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
          onPress={() => setCalendarVisible(true)}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <ThemedText style={{ fontSize: 13, color: colors.text }}>{date}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Quick stats & action row */}
      {staffList.length > 0 && !loading && (
        <View style={styles.summaryRow}>
          <View style={styles.statBox}>
            <ThemedText style={[styles.statValue, { color: '#34C759' }]}>{presentCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Present</ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText style={[styles.statValue, { color: '#FF3B30' }]}>{absentCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</ThemedText>
          </View>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity onPress={() => handleMarkAll('present')} style={[styles.quickBtn, { backgroundColor: '#34C7591A' }]}>
              <ThemedText style={{ color: '#34C759', fontSize: 11, fontWeight: '700' }}>All Present</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMarkAll('absent')} style={[styles.quickBtn, { backgroundColor: '#FF3B301A' }]}>
              <ThemedText style={{ color: '#FF3B30', fontSize: 11, fontWeight: '700' }}>All Absent</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Fresh Day Warning Banner */}
      {staffList.length > 0 && !loading && !hasExistingRegistry && !hasUnsavedChanges && (
        <View style={[styles.warningBanner, { backgroundColor: '#FF950012', borderColor: '#FF950030' }]}>
          <Ionicons name="warning-outline" size={16} color="#FF9500" style={{ marginRight: 8 }} />
          <ThemedText style={{ color: '#FF9500', fontSize: 13, fontWeight: '600' }}>
            Attendance not submitted yet.
          </ThemedText>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, padding: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.studentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
              <Skeleton width="60%" height={16} />
              <View style={styles.toggleGroup}>
                <Skeleton width={60} height={30} borderRadius={8} />
                <Skeleton width={60} height={30} borderRadius={8} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <TypedFlashList
            data={filteredStaff}
            keyExtractor={(item: StaffInfo) => item.id}
            contentContainerStyle={styles.listContent}
            estimatedItemSize={80}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="briefcase-outline" size={64} color={colors.backgroundSelected} />
                <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No staff found.</ThemedText>
              </View>
            }
            renderItem={({ item, index }: { item: StaffInfo; index: number }) => {
              const status = attendanceMap[item.id] || 'absent';
              return (
                <View style={[styles.studentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                  <View style={styles.studentInfo}>
                    <ThemedText style={[styles.indexText, { color: colors.textSecondary }]}>{index + 1}</ThemedText>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <ThemedText style={styles.studentName}>{item.name}</ThemedText>
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{item.customRole?.name || item.role}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.toggleGroup}>
                    <TouchableOpacity 
                      onPress={() => handleToggle(item.id, 'present')} 
                      style={[
                        styles.toggleBtn, 
                        status === 'present' ? { backgroundColor: '#34C759' } : { backgroundColor: colors.background, borderColor: colors.backgroundSelected, borderWidth: 1 }
                      ]}
                    >
                      <ThemedText style={[styles.toggleText, status === 'present' ? { color: '#FFF' } : { color: colors.text }]}>Present</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleToggle(item.id, 'absent')} 
                      style={[
                        styles.toggleBtn, 
                        status === 'absent' ? { backgroundColor: '#FF3B30' } : { backgroundColor: colors.background, borderColor: colors.backgroundSelected, borderWidth: 1 }
                      ]}
                    >
                      <ThemedText style={[styles.toggleText, status === 'absent' ? { color: '#FFF' } : { color: colors.text }]}>Absent</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {staffList.length > 0 && !loading && (
        <View style={[styles.saveBar, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <View style={styles.statusBarLeft}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: (!hasExistingRegistry && !hasUnsavedChanges) ? '#FF950012' : (!canSave ? '#34C75915' : '#FF950015') }
            ]}>
              <Ionicons 
                name={(!hasExistingRegistry && !hasUnsavedChanges) ? "alert-circle" : (!canSave ? "checkmark-circle" : "cloud-upload")} 
                size={14} 
                color={(!hasExistingRegistry && !hasUnsavedChanges) ? "#FF9500" : (!canSave ? "#34C759" : "#FF9500")} 
                style={{ marginRight: 6 }} 
              />
              <ThemedText style={[styles.statusText, { color: (!hasExistingRegistry && !hasUnsavedChanges) ? "#FF9500" : (!canSave ? "#34C759" : "#FF9500") }]}>
                {(!hasExistingRegistry && !hasUnsavedChanges) ? "Not Marked" : (!canSave ? "Synchronized" : "Unsaved Changes")}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: !canSave ? colors.background : '#007AFF' }, (!canSave || submitting) && { opacity: 0.8 }]} 
            onPress={handleSave}
            disabled={submitting || !canSave}
          >
            {submitting ? <ActivityIndicator size="small" color="#FFF" /> : (
              <ThemedText style={[styles.saveBtnText, { color: !canSave ? colors.textSecondary : "#FFF" }]}>Save Attendance</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Calendar Dialog */}
      <Portal>
        <Dialog visible={calendarVisible} onDismiss={() => setCalendarVisible(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 24 }}>
          <Dialog.Title style={{ color: colors.text, fontWeight: '700' }}>Select Date</Dialog.Title>
          <Dialog.Content>
            <Calendar
              current={visibleMonthStr}
              maxDate={getLocalDateString(new Date())}
              onDayPress={(day) => {
                setDate(day.dateString);
                setCalendarVisible(false);
              }}
              onMonthChange={(month) => {
                setVisibleMonthStr(month.dateString.slice(0, 7));
              }}
              markedDates={markedDates}
              theme={{
                calendarBackground: colors.backgroundElement,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: '#007AFF',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#007AFF',
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary + '40',
                monthTextColor: colors.text,
                arrowColor: '#007AFF',
              }}
            />
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Button onPress={() => setCalendarVisible(false)} textColor={colors.textSecondary}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Success Dialog */}
      {successVisible && (
        <Portal>
          <Dialog 
            visible={true} 
            onDismiss={() => setSuccessVisible(false)} 
            style={{ 
              backgroundColor: colors.backgroundElement, 
              borderRadius: 24, 
              maxWidth: 340, 
              width: '85%', 
              alignSelf: 'center',
              padding: 24,
              overflow: 'hidden'
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 32, 
                backgroundColor: '#34C7591A', 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginBottom: 16 
              }}>
                <Ionicons name="checkmark-sharp" size={32} color="#34C759" />
              </View>
              
              <ThemedText style={{ color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                Saved Successfully
              </ThemedText>
              
              <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
                Staff attendance registry has been updated and synchronized.
              </ThemedText>

              <TouchableOpacity 
                style={{ 
                  backgroundColor: '#007AFF', 
                  borderRadius: 14, 
                  paddingVertical: 12, 
                  width: '100%',
                  alignItems: 'center',
                  shadowColor: '#007AFF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 3
                }} 
                onPress={() => setSuccessVisible(false)}
              >
                <ThemedText style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Continue</ThemedText>
              </TouchableOpacity>
            </View>
          </Dialog>
        </Portal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterBar: { flexDirection: 'row', padding: 12, gap: 10, borderBottomWidth: 1 },
  searchContainer: { flex: 1.5, height: 38, borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  searchInput: { flex: 1, fontSize: 13 },
  dateDropdown: { flex: 1, height: 38, borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', gap: 16 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 11 },
  quickActionsContainer: { flexDirection: 'row', marginLeft: 'auto', gap: 8 },
  quickBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  warningBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  studentCard: { borderWidth: 1, borderRadius: 14, padding: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  indexText: { fontSize: 12, fontWeight: 'bold', width: 20, textAlign: 'center' },
  studentName: { fontSize: 14, fontWeight: '600' },
  toggleGroup: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, minWidth: 64, alignItems: 'center' },
  toggleText: { fontSize: 11, fontWeight: 'bold' },
  saveBar: { position: 'absolute', bottom: 12, left: 16, right: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 8 },
  statusBarLeft: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  saveBtn: { paddingHorizontal: 18, height: 38, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  saveBtnText: { fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }
});
