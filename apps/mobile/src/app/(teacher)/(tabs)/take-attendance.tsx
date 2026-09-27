import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Portal, Dialog, Button, Avatar } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from 'expo-router';
import { Skeleton } from '@/components/Skeleton';
import { format } from 'date-fns'; // Added for formatting

const TypedFlashList = FlashList as any;

// Server caps /students at 100 rows per page, so a class is loaded page by page.
const STUDENTS_PAGE_SIZE = 100;

interface ClassInfo {
  id: string;
  name: string;
  section: string;
}

interface StudentInfo {
  id: string;
  name: string;
  rollNumber: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent';
}

export default function TakeAttendanceScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });

  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMoreStudents, setHasMoreStudents] = useState(false);
  const [loadingMoreStudents, setLoadingMoreStudents] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  // Students arrive page by page; these refs let the paging loop read state
  // without re-creating callbacks (and without stale closures).
  const studentsRef = useRef<StudentInfo[]>([]);
  const studentsPageRef = useRef(1);
  const hasMoreStudentsRef = useRef(false);
  // The page request currently in flight, so simultaneous callers join it
  // instead of firing a duplicate one.
  const inFlightPageRef = useRef<Promise<boolean> | null>(null);
  // Bumped on every (class, date) load so an in-flight page 2+ can't land
  // after the teacher switched class or day.
  const loadTokenRef = useRef(0);
  // Saved statuses from the registry, used to seed students that load later.
  const serverStatusRef = useRef<Record<string, 'present' | 'absent'>>({});
  // Last "All Present"/"All Absent" tap, inherited by students that load later.
  const bulkStatusRef = useRef<'present' | 'absent' | null>(null);

  // Picker visibility states
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
  const [visibleMonthStr, setVisibleMonthStr] = useState(() => date.slice(0, 7));
  
  // source of truth for display
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({});
  const [serverMap, setServerMap] = useState<Record<string, 'present' | 'absent'>>({});
  const [saved, setSaved] = useState(false);
  const [hasExistingRegistry, setHasExistingRegistry] = useState(false);
  const [markedMonthsData, setMarkedMonthsData] = useState<Record<string, boolean>>({});

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
    if (!selectedClassId || !visibleMonthStr) return;
    try {
      const res = await api.get<any>(`/attendance?classId=${selectedClassId}&month=${visibleMonthStr}&limit=1000`);
      const records = Array.isArray(res?.records) ? res.records : [];
      const markedDatesMap: Record<string, boolean> = {};
      records.forEach((rec: any) => {
        if (rec.date) {
          markedDatesMap[rec.date] = true;
        }
      });
      setMarkedMonthsData(markedDatesMap);
    } catch (err) {
      console.error('Failed to fetch month attendance status:', err);
    }
  }, [selectedClassId, visibleMonthStr]);

  useEffect(() => {
    fetchMonthAttendanceStatus();
  }, [selectedClassId, visibleMonthStr, fetchMonthAttendanceStatus]);

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    if (!visibleMonthStr) return marked;
    
    const [year, month] = visibleMonthStr.split('-').map(Number);
    
    for (let m = month - 1; m <= month + 1; m++) {
      const targetMonth = (m + 11) % 12;
      const targetYear = year + Math.floor((m - 1) / 12);
      
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(targetYear, targetMonth, d);
        const dateString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const dayName = getDayName(dateObj);
        const isWorkday = workingDays.includes(dayName);
        
        const todayStr = new Date().toISOString().slice(0, 10);
        const isFuture = dateString > todayStr;
        
        if (!isWorkday || isFuture) {
          marked[dateString] = {
            disabled: true,
            disableTouchEvent: true,
            textColor: colors.textSecondary + '40',
          };
        } else {
          const isMarked = markedMonthsData[dateString];
          if (isMarked) {
            marked[dateString] = {
              marked: true,
              dotColor: '#34C759',
            };
          } else {
            // Unmarked workday has orange dot to alert teachers to fill it!
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

  // Fetch classes and settings first
  useEffect(() => {
    async function loadClassesAndSettings() {
      try {
        const [res, resSettings] = await Promise.all([
          api.get<any>('/classes?all=true'),
          api.get<any>('/tenant-settings').catch(() => null)
        ]);
        if (Array.isArray(res) && res.length > 0) {
          setClasses(res);
          setSelectedClassId(res[0].id);
        }
        const wDays = resSettings?.settings?.workingDays;
        if (Array.isArray(wDays)) {
          setWorkingDays(wDays);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadClassesAndSettings();
  }, []);

  // Append a page of students, seeding each one's default status from the
  // saved registry (or the teacher's last All Present/All Absent tap).
  const appendStudents = useCallback((incoming: StudentInfo[]) => {
    if (incoming.length === 0) return;
    const known = new Set(studentsRef.current.map(s => s.id));
    const fresh = incoming.filter(s => !known.has(s.id));
    if (fresh.length === 0) return;

    studentsRef.current = [...studentsRef.current, ...fresh];
    setStudents(studentsRef.current);

    const seeded: Record<string, 'present' | 'absent'> = {};
    fresh.forEach(s => {
      seeded[s.id] = serverStatusRef.current[s.id] ?? bulkStatusRef.current ?? 'absent';
    });
    setAttendanceMap(prev => ({ ...prev, ...seeded }));
    setServerMap(prev => ({ ...prev, ...seeded }));
  }, []);

  const loadStudentsPage = useCallback(async (classId: string, page: number, token: number) => {
    try {
      const res = await api.get<any>(
        `/students?mode=min&classId=${classId}&page=${page}&limit=${STUDENTS_PAGE_SIZE}`
      );
      if (token !== loadTokenRef.current) return false;

      const items: StudentInfo[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items) ? res.items : [];
      const more = Boolean(res?.hasMore);

      appendStudents(items);
      studentsPageRef.current = page;
      hasMoreStudentsRef.current = more;
      setHasMoreStudents(more);
      return true;
    } catch (err) {
      console.error('Failed to load students page', page, err);
      return false;
    }
  }, [appendStudents]);

  // Pull the next page — used by the background prefetch, onEndReached, the
  // retry footer and the save guard. Concurrent callers share one request.
  const fetchNextStudentsPage = useCallback(async (): Promise<boolean> => {
    if (inFlightPageRef.current) return inFlightPageRef.current;
    if (!selectedClassId || !hasMoreStudentsRef.current) return false;

    const token = loadTokenRef.current;
    setLoadingMoreStudents(true);
    setLoadMoreFailed(false);

    const task = (async () => {
      const ok = await loadStudentsPage(selectedClassId, studentsPageRef.current + 1, token);
      if (!ok && token === loadTokenRef.current) setLoadMoreFailed(true);
      return ok;
    })();

    inFlightPageRef.current = task;
    try {
      return await task;
    } finally {
      if (inFlightPageRef.current === task) inFlightPageRef.current = null;
      if (token === loadTokenRef.current) setLoadingMoreStudents(false);
    }
  }, [selectedClassId, loadStudentsPage]);

  // Fetch students and existing registry whenever class or date changes
  const loadRegistry = useCallback(async () => {
    if (!selectedClassId) return;
    const token = ++loadTokenRef.current;
    const isStale = () => token !== loadTokenRef.current;

    // Fresh load — drop everything the previous class/date had queued up
    studentsRef.current = [];
    studentsPageRef.current = 1;
    hasMoreStudentsRef.current = false;
    inFlightPageRef.current = null;
    serverStatusRef.current = {};
    bulkStatusRef.current = null;
    setHasMoreStudents(false);
    setLoadingMoreStudents(false);
    setLoadMoreFailed(false);

    try {
      setLoading(true);
      const startTime = Date.now();
      const [resStudents, resAttendance] = await Promise.all([
        api.get<any>(`/students?mode=min&classId=${selectedClassId}&page=1&limit=${STUDENTS_PAGE_SIZE}`),
        api.get<any>(`/attendance?classId=${selectedClassId}&date=${date}`)
      ]);
      // A newer class/date was selected while this was in flight
      if (isStale()) return;

      const studentList: StudentInfo[] = Array.isArray(resStudents)
        ? resStudents
        : Array.isArray(resStudents?.items) ? resStudents.items : [];
      studentsRef.current = studentList;
      setStudents(studentList);

      const records = Array.isArray(resAttendance?.records) ? resAttendance.records : [];
      setHasExistingRegistry(records.length > 0);

      const initialMap: Record<string, 'present' | 'absent'> = {};
      studentList.forEach((s: StudentInfo) => {
        initialMap[s.id] = 'absent'; // default to absent
      });

      records.forEach((rec: any) => {
        if (rec.studentId && (rec.status === 'present' || rec.status === 'absent')) {
          initialMap[rec.studentId] = rec.status;
        }
      });

      serverStatusRef.current = initialMap;
      setAttendanceMap(initialMap);
      setServerMap(initialMap);
      setSaved(false);

      const more = Boolean(resStudents?.hasMore);
      hasMoreStudentsRef.current = more;
      setHasMoreStudents(more);

      const elapsed = Date.now() - startTime;
      const minDuration = 400;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      if (isStale()) return;
      setLoading(false);

      // Page 1 is on screen already — keep pulling the rest in the background so
      // a 150-student class is complete long before the teacher reaches the end.
      while (hasMoreStudentsRef.current && !isStale()) {
        const ok = await fetchNextStudentsPage();
        if (!ok) break;
      }
    } catch (err) {
      console.error(err);
      if (!isStale()) Alert.alert('Error', 'Failed to load attendance details.');
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [selectedClassId, date, fetchNextStudentsPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
    await loadRegistry();
    setIsRefreshing(false);
  }, [loadRegistry]);

  useFocusEffect(
    useCallback(() => {
      const today = new Date().toISOString().slice(0, 10);
      setDate(today);
    }, [])
  );

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const handleToggle = (studentId: string, status: 'present' | 'absent') => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    // Remembered so students that load later inherit the same mark
    bulkStatusRef.current = status;
    const nextMap: Record<string, 'present' | 'absent'> = {};
    students.forEach(s => {
      nextMap[s.id] = status;
    });
    setAttendanceMap(nextMap);
  };

  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(attendanceMap).some(id => attendanceMap[id] !== serverMap[id]);
  }, [attendanceMap, serverMap]);

  const canSave = hasUnsavedChanges || (!hasExistingRegistry && !saved);

  const handleSave = async () => {
    if (!selectedClassId) return;
    try {
      setSubmitting(true);

      // A big class keeps loading in the background — let it finish first so the
      // registry is never saved with a partial class list.
      while (hasMoreStudentsRef.current) {
        const ok = await fetchNextStudentsPage();
        if (!ok) {
          Alert.alert(
            'Still loading students',
            'The rest of this class is still downloading. Please try again in a moment.'
          );
          return;
        }
      }

      const recordsPayload = studentsRef.current.map(s => ({
        studentId: s.id,
        status: attendanceMap[s.id] ?? serverStatusRef.current[s.id] ?? bulkStatusRef.current ?? 'absent',
      }));

      await api.post('/attendance', {
        classId: selectedClassId,
        date,
        records: recordsPayload
      });

      setSuccessVisible(true);
      setServerMap(attendanceMap);
      setSaved(true);
      loadRegistry();
      fetchMonthAttendanceStatus();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save attendance registry.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const presentCount = Object.values(attendanceMap).filter(v => v === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'absent').length;
  
  const isFreshDay = !hasExistingRegistry && !saved && !hasUnsavedChanges;

  return (
    <ThemedView style={styles.container}>
      {/* Selection row */}
      <View style={[styles.filterBar, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.backgroundSelected }]}>
        <TouchableOpacity 
          style={[styles.filterDropdown, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]} 
          onPress={() => setClassPickerVisible(true)}
        >
          <Ionicons name="school-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <ThemedText style={{ fontSize: 13, color: colors.text, flex: 1 }} numberOfLines={1}>
            Class: {selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'Select Class'}
          </ThemedText>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterDropdown, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
          onPress={() => setCalendarVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <ThemedText style={{ fontSize: 13, color: colors.text }}>{format(new Date(date), 'dd-MM-yyyy')}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Quick stats & action row */}
      {students.length > 0 && !loading && (
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
      {students.length > 0 && !loading && isFreshDay && (
        <View style={[styles.warningBanner, { backgroundColor: '#FF950012', borderColor: '#FF950030' }]}>
          <Ionicons name="warning-outline" size={16} color="#FF9500" style={{ marginRight: 8 }} />
          <ThemedText style={{ color: '#FF9500', fontSize: 13, fontWeight: '600' }}>
            Attendance not submitted yet.
          </ThemedText>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, padding: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={[styles.studentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, alignItems: 'center' }]}>
              <View style={styles.studentInfo}>
                <Skeleton width={16} height={12} style={{ marginRight: 8 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
              <View style={styles.toggleGroup}>
                <Skeleton width={64} height={32} borderRadius={8} />
                <Skeleton width={64} height={32} borderRadius={8} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <TypedFlashList
            data={students}
            keyExtractor={(item: StudentInfo) => item.id}
            contentContainerStyle={styles.listContent}
            estimatedItemSize={70}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            onEndReached={fetchNextStudentsPage}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={colors.backgroundSelected} />
                <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No students found in this class.</ThemedText>
              </View>
            }
            ListFooterComponent={
              students.length === 0 ? null : loadingMoreStudents ? (
                <View style={styles.listFooter}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                  <ThemedText style={[styles.listFooterText, { color: colors.textSecondary }]}>
                    Loading more students…
                  </ThemedText>
                </View>
              ) : loadMoreFailed ? (
                <TouchableOpacity style={styles.listFooter} onPress={fetchNextStudentsPage} activeOpacity={0.7}>
                  <Ionicons name="refresh" size={14} color="#007AFF" />
                  <ThemedText style={[styles.listFooterText, { color: '#007AFF', fontWeight: '600' }]}>
                    Couldn't load the rest — tap to retry
                  </ThemedText>
                </TouchableOpacity>
              ) : hasMoreStudents ? (
                <View style={styles.listFooter}>
                  <ThemedText style={[styles.listFooterText, { color: colors.textSecondary }]}>
                    Showing {students.length} students — scroll for more
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.listFooter}>
                  <ThemedText style={[styles.listFooterText, { color: colors.textSecondary }]}>
                    All {students.length} {students.length === 1 ? 'student' : 'students'} loaded
                  </ThemedText>
                </View>
              )
            }
            renderItem={({ item, index }: { item: StudentInfo; index: number }) => {
              const status = attendanceMap[item.id] || 'present';
              return (
                <View style={[styles.studentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                  <View style={styles.studentInfo}>
                    <ThemedText style={[styles.indexText, { color: colors.textSecondary }]}>{index + 1}</ThemedText>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <ThemedText style={styles.studentName}>{item.name}</ThemedText>
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>Roll No: {item.rollNumber || 'N/A'}</ThemedText>
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

      {students.length > 0 && !loading && (
        <View style={[styles.saveBar, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <View style={styles.statusBarLeft}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: isFreshDay ? '#FF950012' : (!canSave ? '#34C75915' : '#FF950015') }
            ]}>
              <Ionicons 
                name={isFreshDay ? "alert-circle" : (!canSave ? "checkmark-circle" : "cloud-upload")} 
                size={14} 
                color={isFreshDay ? "#FF9500" : (!canSave ? "#34C759" : "#FF9500")} 
                style={{ marginRight: 6 }} 
              />
              <ThemedText style={[styles.statusText, { color: isFreshDay ? "#FF9500" : (!canSave ? "#34C759" : "#FF9500") }]}>
                {isFreshDay ? "Not Marked" : (!canSave ? "Synchronized" : "Unsaved Changes")}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.saveBtn, 
              { backgroundColor: !canSave ? colors.background : '#007AFF' },
              (!canSave || submitting) && { opacity: 0.8 }
            ]} 
            onPress={handleSave}
            disabled={submitting || !canSave}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons 
                  name={isFreshDay ? "send-outline" : (!canSave ? "checkmark-sharp" : "save-outline")} 
                  size={16} 
                  color={!canSave ? colors.textSecondary : "#FFF"} 
                  style={{ marginRight: 4 }}
                />
                <ThemedText style={[styles.saveBtnText, { color: !canSave ? colors.textSecondary : "#FFF" }]}>
                  {isFreshDay ? "Submit" : (!canSave ? 'Saved' : 'Save')}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Class Picker Dialog */}
      {classPickerVisible && (
        <Portal>
          <Dialog 
            visible={true} 
            onDismiss={() => setClassPickerVisible(false)}
            style={{ backgroundColor: colors.backgroundElement, maxWidth: 400, width: '90%', alignSelf: 'center' }}
          >
            <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
            <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
              <View style={{ height: 300, width: '100%' }}>
                <TypedFlashList
                  data={classes}
                  keyExtractor={(item: ClassInfo) => item.id}
                  estimatedItemSize={50}
                  renderItem={({ item }: { item: ClassInfo }) => (
                    <TouchableOpacity 
                      style={styles.pickerItem}
                      onPress={() => {
                        setSelectedClassId(item.id);
                        setClassPickerVisible(false);
                      }}
                    >
                      <ThemedText style={{ color: selectedClassId === item.id ? '#007AFF' : colors.text }}>
                        {item.name} - {item.section}
                      </ThemedText>
                      {selectedClassId === item.id && <Ionicons name="checkmark" size={18} color="#007AFF" />}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button textColor="#007AFF" onPress={() => setClassPickerVisible(false)}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}

      {/* Success Dialog */}
      {successVisible && (
        <Portal>
          <Dialog 
            visible={true} 
            onDismiss={() => setSuccessVisible(false)}
            style={{ backgroundColor: colors.backgroundElement, borderRadius: 20, maxWidth: 400, width: '90%', alignSelf: 'center' }}
          >
            <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 8 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#34C75915', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="checkmark-circle" size={36} color="#34C759" />
              </View>
              <Dialog.Title style={{ color: colors.text, textAlign: 'center', fontSize: 18, fontWeight: '700' }}>Saved Successfully</Dialog.Title>
              <Dialog.Content>
                <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13 }}>
                  Attendance registry has been successfully saved and synchronized.
                </ThemedText>
              </Dialog.Content>
            </View>
            <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 16 }}>
              <Button 
                mode="contained" 
                buttonColor="#007AFF" 
                textColor="#FFF" 
                style={{ borderRadius: 10, paddingHorizontal: 24 }} 
                onPress={() => setSuccessVisible(false)}
              >
                Okay
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}

      {/* Calendar Picker Dialog */}
      {calendarVisible && (
        <Portal>
          <Dialog 
            visible={true} 
            onDismiss={() => setCalendarVisible(false)}
            style={{ backgroundColor: colors.backgroundElement, borderRadius: 20, maxWidth: 400, width: '90%', alignSelf: 'center' }}
          >
            <Dialog.Content style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
              <Calendar
                current={date}
                maxDate={new Date().toISOString().slice(0, 10)}
                markedDates={markedDates}
                onDayPress={(day) => {
                  setDate(day.dateString);
                  setCalendarVisible(false);
                }}
                onMonthChange={(month) => {
                  setVisibleMonthStr(`${month.year}-${String(month.month).padStart(2, '0')}`);
                }}
                theme={{
                  backgroundColor: colors.backgroundElement,
                  calendarBackground: colors.backgroundElement,
                  textSectionTitleColor: colors.textSecondary,
                  selectedDayBackgroundColor: '#007AFF',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#007AFF',
                  dayTextColor: colors.text,
                  textDisabledColor: colors.textSecondary + '40',
                  dotColor: '#007AFF',
                  selectedDotColor: '#ffffff',
                  arrowColor: colors.text,
                  disabledArrowColor: colors.textSecondary + '40',
                  monthTextColor: colors.text,
                  indicatorColor: '#007AFF',
                  textDayFontWeight: '300',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12
                }}
              />
            </Dialog.Content>

            <Dialog.Actions>
              <Button textColor="#FF3B30" onPress={() => setCalendarVisible(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
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
    gap: 12,
    borderBottomWidth: 1,
  },
  filterDropdown: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  listFooterText: {
    fontSize: 12,
  },
  studentCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  indexText: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  saveBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    gap: 12,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1.5,
    minWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  statusBarLeft: {
    marginLeft: 0,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveBtn: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
});
