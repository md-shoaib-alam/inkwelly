import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useAuth } from '@/store/auth-context';
import { Portal, Dialog, Button } from 'react-native-paper';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { CustomAlert } from '@/components/ui/CustomAlert';

const TypedFlashList = FlashList as any;

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentClass?: string;
  studentRollNumber?: string;
  status: string; // 'not_submitted', 'submitted', 'graded'
  assignmentId: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectName: string;
  className: string;
  teacherName: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  ungradedSubmissions: number;
  mode: string;
}

interface ClassInfo {
  id: string;
  name: string;
  section: string;
}

interface SubjectInfo {
  id: string;
  name: string;
  teacherId: string;
  classId: string;
  className?: string;
}

export default function HomeworkScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'active' | 'overdue' | 'completed'>('active');
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [overdueAssignments, setOverdueAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Animated sliding indicators and layouts
  const [layoutWidth, setLayoutWidth] = useState(360);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const scrollViewRef = React.useRef<ScrollView | null>(null);

  // Create Form Dialog
  const [createVisible, setCreateVisible] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [formClassId, setFormClassId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [formMode, setFormMode] = useState<'online' | 'offline'>('offline');
  const [isCreating, setIsCreating] = useState(false);

  // Submissions Dialog State
  const [submissionsVisible, setSubmissionsVisible] = useState(false);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [editedStatuses, setEditedStatuses] = useState<Record<string, string>>({});
  const [isSavingSubmissions, setIsSavingSubmissions] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    showCancel?: boolean;
    confirmText?: string;
    confirmColor?: string;
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, options?: Omit<typeof alertConfig, 'visible' | 'title' | 'message'>) => {
    setAlertConfig({ visible: true, title, message, ...options });
  };

  // Picker visibility
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [modePickerVisible, setModePickerVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const [resActive, resCompleted] = await Promise.all([
        api.get('/homework?mine=true&status=active').catch(() => []),
        api.get('/homework?mine=true&status=completed').catch(() => [])
      ]);
      
      const activeData = Array.isArray(resActive) ? resActive : [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const active: Assignment[] = [];
      const overdue: Assignment[] = [];
      
      for (const item of activeData) {
        const itemDate = new Date(item.dueDate);
        itemDate.setHours(0, 0, 0, 0);
        if (itemDate < today && item.ungradedSubmissions > 0) {
          overdue.push(item);
        } else {
          active.push(item);
        }
      }

      setActiveAssignments(active);
      setOverdueAssignments(overdue);
      setCompletedAssignments(Array.isArray(resCompleted) ? resCompleted : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleTabPress = (tab: 'active' | 'overdue' | 'completed') => {
    setActiveTab(tab);
    if (scrollViewRef.current) {
      const index = tab === 'active' ? 0 : tab === 'overdue' ? 1 : 2;
      scrollViewRef.current.scrollTo({ x: index * layoutWidth, animated: true });
    }
  };

  const handleScroll = (event: any) => {
    if (layoutWidth === 0) return;
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / layoutWidth);
    const newTab = index === 0 ? 'active' : index === 1 ? 'overdue' : 'completed';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const onLayout = (event: any) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  const openCreateDialog = async () => {
    setCreateVisible(true);
    try {
      const [resClasses, resSubjects, resTimetable] = await Promise.all([
        api.get('/classes?mode=min').catch(() => []),
        api.get('/subjects?mine=true').catch(() => []),
        api.get('/timetable?mine=true').catch(() => [])
      ]);
      const subjectList = Array.isArray(resSubjects) ? resSubjects : [];
      const timetableList = Array.isArray(resTimetable) ? resTimetable : [];

      // Extract unique subjects from timetable slots
      const timetableSubjects: SubjectInfo[] = [];
      const seen = new Set<string>();
      timetableList.forEach((t: any) => {
        if (t.subjectId && t.subjectName) {
          const key = `${t.subjectId}-${t.classId}`;
          if (!seen.has(key)) {
            seen.add(key);
            timetableSubjects.push({
              id: t.subjectId,
              name: t.subjectName,
              className: t.className || 'Class',
              classId: t.classId || '',
              teacherId: t.teacherId || '',
            });
          }
        }
      });

      // Combine assigned subjects and timetable subjects
      const combined = [...subjectList];
      const seenCombined = new Set(subjectList.map(s => `${s.id}-${s.classId}`));
      timetableSubjects.forEach((ts) => {
        const key = `${ts.id}-${ts.classId}`;
        if (!seenCombined.has(key)) {
          seenCombined.add(key);
          combined.push(ts);
        }
      });

      setSubjects(combined);

      // Derive classes directly from combined subjects to ensure match
      const classesMap = new Map();
      combined.forEach((s: any) => {
        if (s.classId && !classesMap.has(s.classId)) {
          const parts = (s.className || '').split('-');
          classesMap.set(s.classId, {
            id: s.classId,
            name: parts[0] || s.className || 'Class',
            section: parts[1] || 'A'
          });
        }
      });
      const derivedClasses = Array.from(classesMap.values()).sort((a: any, b: any) => 
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );

      let classList = derivedClasses;
      if (classList.length === 0) {
        classList = Array.isArray(resClasses) ? resClasses : [];
        if (classList.length === 0) {
          const fallback = await api.get('/classes?all=true').catch(() => []);
          classList = Array.isArray(fallback) ? fallback : [];
        }
      }
      
      setClasses(classList);
      if (classList.length > 0) {
        setFormClassId(classList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredSubjects = useMemo(() => {
    if (!formClassId) return [];
    return subjects.filter(s => s.classId === formClassId);
  }, [subjects, formClassId]);

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      if (!filteredSubjects.some(s => s.id === formSubjectId)) {
        setFormSubjectId(filteredSubjects[0].id);
      }
    } else {
      setFormSubjectId('');
    }
  }, [filteredSubjects, formSubjectId]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !formDesc.trim()) {
      showAlert('Error', 'Please fill in title and description.');
      return;
    }
    const currentSubject = subjects.find(s => s.id === formSubjectId);
    if (!currentSubject) {
      showAlert('Error', 'Invalid subject selection.');
      return;
    }

    try {
      setIsCreating(true);
      await api.post('/homework', {
        classId: formClassId,
        subjectId: formSubjectId,
        teacherId: currentSubject.teacherId,
        title: formTitle.trim(),
        description: formDesc.trim(),
        dueDate: formDueDate,
        mode: formMode
      });
      setCreateVisible(false);
      setFormTitle('');
      setFormDesc('');
      fetchAssignments();
      showAlert('Success', 'Homework created successfully!');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Failed to create homework.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleComplete = (id: string) => {
    showAlert('Complete Homework', 'Are you sure you want to finalize this homework assignment?', {
      showCancel: true,
      confirmText: 'Complete',
      confirmColor: '#FF3B30',
      onConfirm: async () => {
        try {
          await api.put(`/homework/${id}/complete`, {});
          fetchAssignments();
          showAlert('Success', 'Homework marked as completed.');
        } catch (e) {
          showAlert('Error', 'Failed to update homework.');
        }
      }
    });
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignmentForSubmissions(assignment);
    setSubmissionsVisible(true);
    setLoadingSubmissions(true);
    setEditedStatuses({});
    try {
      const res: any = await api.get(`/submissions?assignmentId=${assignment.id}`);
      const dataArray = res?.data ? res.data : (Array.isArray(res) ? res : []);
      setSubmissions(dataArray);
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to load submissions.');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleToggleSubmissionStatus = (sub: Submission) => {
    const currentStatus = editedStatuses[sub.id] || sub.status;
    const isCurrentlySubmitted = currentStatus === "submitted" || currentStatus === "graded";
    const nextStatus = isCurrentlySubmitted ? "not_submitted" : "submitted";

    setEditedStatuses((prev) => ({
      ...prev,
      [sub.id]: nextStatus,
    }));
  };

  const handleSaveBulkSubmissions = async () => {
    if (!selectedAssignmentForSubmissions) return;
    const entries = Object.entries(editedStatuses);
    if (entries.length === 0) return;

    setIsSavingSubmissions(true);
    try {
      const updates = entries.map(([id, status]) => ({
        id,
        status,
        assignmentId: selectedAssignmentForSubmissions.id,
      }));

      await api.put('/submissions/bulk', {
        assignmentId: selectedAssignmentForSubmissions.id,
        updates,
      });

      showAlert('Success', `Successfully saved ${updates.length} changes!`);
      setEditedStatuses({});
      // Refresh assignments to get latest counts
      fetchAssignments();
      // Close the modal
      setSubmissionsVisible(false);
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to save changes.');
    } finally {
      setIsSavingSubmissions(false);
    }
  };

  const selectedClass = classes.find(c => c.id === formClassId);
  const selectedSubject = filteredSubjects.find(s => s.id === formSubjectId);

  const translateX = scrollX.interpolate({
    inputRange: [0, layoutWidth, layoutWidth * 2],
    outputRange: [0, layoutWidth / 3, (layoutWidth / 3) * 2],
    extrapolate: 'clamp',
  });

  return (
    <ThemedView style={styles.container} onLayout={onLayout}>
      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => handleTabPress('active')}
        >
          <ThemedText style={{ color: activeTab === 'active' ? '#007AFF' : colors.textSecondary, fontWeight: '700' }}>Active</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => handleTabPress('overdue')}
        >
          <ThemedText style={{ color: activeTab === 'overdue' ? '#FF3B30' : colors.textSecondary, fontWeight: '700' }}>
            Overdue
            {overdueAssignments.length > 0 && ` (${overdueAssignments.length})`}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => handleTabPress('completed')}
        >
          <ThemedText style={{ color: activeTab === 'completed' ? '#34C759' : colors.textSecondary, fontWeight: '700' }}>Completed</ThemedText>
        </TouchableOpacity>
        <Animated.View style={[styles.tabIndicator, { 
          width: layoutWidth / 3, 
          transform: [{ translateX }], 
          backgroundColor: activeTab === 'completed' ? '#34C759' : activeTab === 'overdue' ? '#FF3B30' : '#007AFF' 
        }]} />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          <View style={{ width: layoutWidth, flex: 1 }}>
            <TypedFlashList
              data={activeAssignments}
              keyExtractor={(item: Assignment) => item.id}
              contentContainerStyle={styles.listContent}
              estimatedItemSize={120}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="clipboard-outline" size={64} color={colors.backgroundSelected} />
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No active homework assignments found.</ThemedText>
                </View>
              }
              renderItem={({ item }: { item: Assignment }) => (
                <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                  <View style={styles.cardHeader}>
                    <ThemedText style={[styles.titleText, { flex: 1, marginRight: 8, color: colors.text }]}>{item.title}</ThemedText>
                    <View style={[styles.badge, { backgroundColor: '#007AFF15' }]}>
                      <ThemedText style={{ color: '#007AFF', fontSize: 10, fontWeight: '700' }}>
                        {item.mode.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.descText, { color: colors.textSecondary }]}>{item.description}</ThemedText>
                  
                  <View style={styles.metaRow}>
                    <View style={[styles.metaBadge, { backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
                      <Ionicons name="school-outline" size={13} color={colors.textSecondary} />
                      <ThemedText style={[styles.metaText, { color: colors.text }]}>{item.className}</ThemedText>
                    </View>
                    <View style={[styles.metaBadge, { backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
                      <Ionicons name="book-outline" size={13} color={colors.textSecondary} />
                      <ThemedText style={[styles.metaText, { color: colors.text }]}>{item.subjectName}</ThemedText>
                    </View>
                  </View>
 
                  <View style={[styles.cardFooter, { borderTopColor: colors.backgroundSelected }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                        Due: <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{item.dueDate}</ThemedText>
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                        Submissions: <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{item.submissions}/{item.totalStudents}</ThemedText>
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={[styles.viewSubmissionsBtn, { borderColor: colors.backgroundSelected, flex: 1 }]} onPress={() => handleViewSubmissions(item)}>
                        <Ionicons name="eye-outline" size={16} color={colors.text} style={{ marginRight: 4 }} />
                        <ThemedText style={[styles.viewSubmissionsBtnText, { color: colors.text }]} numberOfLines={1}>View</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.completeBtn, { borderRadius: 20, flex: 1, height: 38, justifyContent: 'center' }]} onPress={() => handleComplete(item.id)}>
                        <Ionicons name="checkmark-done" size={16} color="#FFF" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.completeBtnText} numberOfLines={1}>Finalize</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>

          <View style={{ width: layoutWidth, flex: 1 }}>
            <TypedFlashList
              data={overdueAssignments}
              keyExtractor={(item: Assignment) => item.id}
              contentContainerStyle={styles.listContent}
              estimatedItemSize={120}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="clipboard-outline" size={64} color={colors.backgroundSelected} />
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No overdue homework assignments found.</ThemedText>
                </View>
              }
              renderItem={({ item }: { item: Assignment }) => (
                <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                  <View style={styles.cardHeader}>
                    <ThemedText style={[styles.titleText, { flex: 1, marginRight: 8, color: colors.text }]}>{item.title}</ThemedText>
                    <View style={[styles.badge, { backgroundColor: '#FF3B3015' }]}>
                      <ThemedText style={{ color: '#FF3B30', fontSize: 10, fontWeight: '700' }}>
                        {item.mode.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.descText, { color: colors.textSecondary }]}>{item.description}</ThemedText>
                  
                  <View style={styles.metaRow}>
                    <View style={[styles.metaBadge, { backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
                      <Ionicons name="school-outline" size={13} color={colors.textSecondary} />
                      <ThemedText style={[styles.metaText, { color: colors.text }]}>{item.className}</ThemedText>
                    </View>
                    <View style={[styles.metaBadge, { backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
                      <Ionicons name="book-outline" size={13} color={colors.textSecondary} />
                      <ThemedText style={[styles.metaText, { color: colors.text }]}>{item.subjectName}</ThemedText>
                    </View>
                  </View>
 
                  <View style={[styles.cardFooter, { borderTopColor: colors.backgroundSelected }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                        Due: <ThemedText style={{ fontWeight: 'bold', color: '#FF3B30' }}>{item.dueDate}</ThemedText>
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                        Submissions: <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{item.submissions}/{item.totalStudents}</ThemedText>
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={[styles.viewSubmissionsBtn, { borderColor: colors.backgroundSelected, flex: 1 }]} onPress={() => handleViewSubmissions(item)}>
                        <Ionicons name="eye-outline" size={16} color={colors.text} style={{ marginRight: 4 }} />
                        <ThemedText style={[styles.viewSubmissionsBtnText, { color: colors.text }]} numberOfLines={1}>View</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.completeBtn, { borderRadius: 20, flex: 1, height: 38, justifyContent: 'center' }]} onPress={() => handleComplete(item.id)}>
                        <Ionicons name="checkmark-done" size={16} color="#FFF" style={{ marginRight: 4 }} />
                        <ThemedText style={styles.completeBtnText} numberOfLines={1}>Finalize</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>

          <View style={{ width: layoutWidth, flex: 1 }}>
            <TypedFlashList
              data={completedAssignments}
              keyExtractor={(item: Assignment) => item.id}
              contentContainerStyle={styles.listContent}
              estimatedItemSize={120}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={64} color={colors.backgroundSelected} />
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No completed homework assignments found.</ThemedText>
                </View>
              }
              renderItem={({ item }: { item: Assignment }) => (
                <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                  <View style={styles.cardHeader}>
                    <ThemedText style={[styles.titleText, { flex: 1, marginRight: 8, color: colors.text }]}>{item.title}</ThemedText>
                    <View style={[styles.badge, { backgroundColor: '#34C75915' }]}>
                      <ThemedText style={{ color: '#34C759', fontSize: 10, fontWeight: '700' }}>
                        {item.mode.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.descText, { color: colors.textSecondary }]}>{item.description}</ThemedText>
                  
                  <View style={styles.metaRow}>
                    <View style={[styles.metaBadge, { backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
                      <Ionicons name="school-outline" size={13} color={colors.textSecondary} />
                      <ThemedText style={[styles.metaText, { color: colors.text }]}>{item.className}</ThemedText>
                    </View>
                    <View style={[styles.metaBadge, { backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
                      <Ionicons name="book-outline" size={13} color={colors.textSecondary} />
                      <ThemedText style={[styles.metaText, { color: colors.text }]}>{item.subjectName}</ThemedText>
                    </View>
                  </View>
 
                  <View style={[styles.cardFooter, { borderTopColor: colors.backgroundSelected }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                        Due: <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{item.dueDate}</ThemedText>
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                        Submissions: <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{item.submissions}/{item.totalStudents}</ThemedText>
                      </ThemedText>
                    </View>
                    <TouchableOpacity style={[styles.viewSubmissionsBtn, { borderColor: colors.backgroundSelected, flex: 1 }]} onPress={() => handleViewSubmissions(item)}>
                      <Ionicons name="eye-outline" size={16} color={colors.text} style={{ marginRight: 6 }} />
                      <ThemedText style={[styles.viewSubmissionsBtnText, { color: colors.text }]}>View Submissions</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </Animated.ScrollView>
      )}

      {/* FAB */}
      {activeTab === 'active' && (
        <TouchableOpacity style={styles.fab} onPress={openCreateDialog}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Create Modal Dialog */}
      <Portal>
        <Dialog 
          visible={createVisible} 
          onDismiss={() => setCreateVisible(false)} 
          style={{ backgroundColor: colors.backgroundElement, maxWidth: 400, width: '92%', alignSelf: 'center', borderRadius: 20, overflow: 'hidden' }}
        >
          <Dialog.Title style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginHorizontal: 24, marginTop: 24, marginBottom: 8 }}>
            Add Homework
          </Dialog.Title>
          <Dialog.Content style={{ paddingHorizontal: 20 }}>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              
              {/* Homework Title Input */}
              <View style={[styles.inputContainer, { borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }]}>
                <Ionicons name="create-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Homework Title"
                  placeholderTextColor={colors.textSecondary}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  style={[styles.inputField, { color: colors.text }]}
                />
              </View>

              {/* Description Input */}
              <View style={[styles.inputContainer, { borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement, marginTop: 12, height: 80, alignItems: 'flex-start', paddingTop: 10 }]}>
                <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Description"
                  placeholderTextColor={colors.textSecondary}
                  value={formDesc}
                  onChangeText={setFormDesc}
                  multiline
                  numberOfLines={3}
                  style={[styles.inputField, { color: colors.text, height: '100%', textAlignVertical: 'top' }]}
                />
              </View>

              {/* Class Selector */}
              <TouchableOpacity 
                style={[styles.selectBtn, { borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement, marginTop: 12 }]} 
                onPress={() => setClassPickerVisible(true)}
              >
                <View style={styles.selectBtnLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: '#007AFF15' }]}>
                    <Ionicons name="school-outline" size={18} color="#007AFF" />
                  </View>
                  <View style={styles.selectBtnContent}>
                    <ThemedText style={styles.selectLabel}>Class</ThemedText>
                    <ThemedText style={[styles.selectValue, { color: selectedClass ? colors.text : colors.textSecondary }]}>
                      {selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'Select Class'}
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Subject Selector */}
              <TouchableOpacity 
                style={[styles.selectBtn, { borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement, marginTop: 12 }]} 
                onPress={() => formClassId ? setSubjectPickerVisible(true) : showAlert('Warning', 'Please select a class first')}
              >
                <View style={styles.selectBtnLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: '#34C75915' }]}>
                    <Ionicons name="book-outline" size={18} color="#34C759" />
                  </View>
                  <View style={styles.selectBtnContent}>
                    <ThemedText style={styles.selectLabel}>Subject</ThemedText>
                    <ThemedText style={[styles.selectValue, { color: selectedSubject ? colors.text : colors.textSecondary }]}>
                      {selectedSubject ? selectedSubject.name : (formClassId ? 'Select Subject' : 'Select Class First')}
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Mode Selector */}
              <TouchableOpacity 
                style={[styles.selectBtn, { borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement, marginTop: 12 }]} 
                onPress={() => setModePickerVisible(true)}
              >
                <View style={styles.selectBtnLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: '#AF52DE15' }]}>
                    <Ionicons name="send-outline" size={18} color="#AF52DE" />
                  </View>
                  <View style={styles.selectBtnContent}>
                    <ThemedText style={styles.selectLabel}>Submission Mode</ThemedText>
                    <ThemedText style={[styles.selectValue, { color: colors.text }]}>
                      {formMode.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Due Date Selector */}
              <TouchableOpacity 
                style={[styles.selectBtn, { borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement, marginTop: 12 }]} 
                onPress={() => setCalendarVisible(true)}
              >
                <View style={styles.selectBtnLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: '#FF950015' }]}>
                    <Ionicons name="calendar-outline" size={18} color="#FF9500" />
                  </View>
                  <View style={styles.selectBtnContent}>
                    <ThemedText style={styles.selectLabel}>Due Date</ThemedText>
                    <ThemedText style={[styles.selectValue, { color: formDueDate ? colors.text : colors.textSecondary }]}>
                      {formDueDate || 'Select Due Date'}
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}>
            <Button 
              mode="outlined" 
              textColor={colors.textSecondary} 
              onPress={() => setCreateVisible(false)}
              style={{ borderColor: colors.backgroundSelected, borderRadius: 10, flex: 1 }}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFFFFF" 
              onPress={handleCreate} 
              disabled={isCreating}
              style={{ borderRadius: 10, flex: 1 }}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Class Picker */}
      <Portal>
        <Dialog 
          visible={classPickerVisible} 
          onDismiss={() => setClassPickerVisible(false)} 
          style={{ backgroundColor: colors.backgroundElement, maxWidth: 400, width: '90%', alignSelf: 'center' }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Class</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <View style={{ height: 250, width: '100%' }}>
              <TypedFlashList
                data={classes}
                keyExtractor={(item: ClassInfo) => item.id}
                estimatedItemSize={50}
                renderItem={({ item }: { item: ClassInfo }) => (
                  <TouchableOpacity 
                    style={[styles.pickerItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                    onPress={() => {
                      setFormClassId(item.id);
                      setClassPickerVisible(false);
                    }}
                  >
                    <ThemedText style={{ color: formClassId === item.id ? '#007AFF' : colors.text, fontWeight: formClassId === item.id ? '600' : '400' }}>
                      {item.name} - {item.section}
                    </ThemedText>
                    {formClassId === item.id && (
                      <Ionicons name="checkmark" size={18} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              style={{ borderRadius: 20, minWidth: 100 }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={() => setClassPickerVisible(false)}
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Subject Picker */}
      <Portal>
        <Dialog 
          visible={subjectPickerVisible} 
          onDismiss={() => setSubjectPickerVisible(false)} 
          style={{ backgroundColor: colors.backgroundElement, maxWidth: 400, width: '90%', alignSelf: 'center' }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Subject</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <View style={{ height: 250, width: '100%' }}>
              <TypedFlashList
                data={filteredSubjects}
                keyExtractor={(item: SubjectInfo) => item.id}
                estimatedItemSize={50}
                renderItem={({ item }: { item: SubjectInfo }) => (
                  <TouchableOpacity 
                    style={[styles.pickerItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                    onPress={() => {
                      setFormSubjectId(item.id);
                      setSubjectPickerVisible(false);
                    }}
                  >
                    <ThemedText style={{ color: formSubjectId === item.id ? '#007AFF' : colors.text, fontWeight: formSubjectId === item.id ? '600' : '400' }}>
                      {item.name}
                    </ThemedText>
                    {formSubjectId === item.id && (
                      <Ionicons name="checkmark" size={18} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              style={{ borderRadius: 20, minWidth: 100 }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={() => setSubjectPickerVisible(false)}
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Mode Picker */}
      <Portal>
        <Dialog 
          visible={modePickerVisible} 
          onDismiss={() => setModePickerVisible(false)} 
          style={{ backgroundColor: colors.backgroundElement, maxWidth: 400, width: '90%', alignSelf: 'center' }}
        >
          <Dialog.Title style={{ color: colors.text }}>Submission Mode</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            {[
              { value: 'offline', label: 'Offline (Classroom)', disabled: false },
              { value: 'online', label: 'Online (🔒 Premium Only)', disabled: true }
            ].map((m) => (
              <TouchableOpacity 
                key={m.value}
                disabled={m.disabled}
                style={[styles.pickerItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: m.disabled ? 0.5 : 1 }]}
                onPress={() => {
                  setFormMode(m.value as any);
                  setModePickerVisible(false);
                }}
              >
                <ThemedText style={{ color: formMode === m.value ? '#007AFF' : colors.text, fontWeight: formMode === m.value ? '600' : '400' }}>
                  {m.label}
                </ThemedText>
                {formMode === m.value && (
                  <Ionicons name="checkmark" size={18} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              style={{ borderRadius: 20, minWidth: 100 }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={() => setModePickerVisible(false)}
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Date Picker (Calendar Dialog) */}
      <DatePickerModal
        visible={calendarVisible}
        onDismiss={() => setCalendarVisible(false)}
        value={formDueDate}
        onSelectDate={(dateStr) => {
          setFormDueDate(dateStr);
          setCalendarVisible(false);
        }}
        title="Select Due Date"
      />

      {/* Submissions Modal */}
      <Portal>
        <Dialog 
          visible={submissionsVisible} 
          onDismiss={() => {
            if (!isSavingSubmissions) setSubmissionsVisible(false);
          }} 
          style={{ backgroundColor: colors.backgroundElement, maxWidth: 600, width: '92%', alignSelf: 'center', borderRadius: 20, overflow: 'hidden' }}
        >
          <Dialog.Title style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginHorizontal: 24, marginTop: 24, marginBottom: 8 }}>
            <Ionicons name="document-text-outline" size={18} color="#007AFF" style={{ marginRight: 8 }} />
            {selectedAssignmentForSubmissions?.title || 'Submissions'}
          </Dialog.Title>
          <Dialog.Content style={{ paddingHorizontal: 20 }}>
            <ThemedText style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 13 }}>
              {selectedAssignmentForSubmissions?.subjectName} • {selectedAssignmentForSubmissions?.className} • Due: {selectedAssignmentForSubmissions?.dueDate}
            </ThemedText>

            {loadingSubmissions ? (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
                <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>Loading submissions...</ThemedText>
              </View>
            ) : submissions.length === 0 ? (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="people-outline" size={48} color={colors.backgroundSelected} />
                <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No students assigned</ThemedText>
              </View>
            ) : (
              <View style={{ maxHeight: 400 }}>
                <TypedFlashList
                  data={submissions}
                  keyExtractor={(item: Submission) => item.id}
                  estimatedItemSize={70}
                  renderItem={({ item }: { item: Submission }) => {
                    const currentStatus = editedStatuses[item.id] || item.status;
                    const isSubmitted = currentStatus === "submitted" || currentStatus === "graded";
                    const isChanged = editedStatuses[item.id] !== undefined && editedStatuses[item.id] !== item.status;

                    return (
                      <View style={[
                        styles.submissionCard, 
                        { 
                          backgroundColor: isSubmitted ? (activeTheme === 'dark' ? '#064e3b30' : '#ecfdf580') : colors.backgroundElement,
                          borderColor: isChanged ? '#007AFF' : (isSubmitted ? '#10b98180' : colors.backgroundSelected),
                          borderWidth: isChanged ? 1.5 : 1,
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          gap: 12,
                        }
                      ]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1, paddingRight: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                              <ThemedText style={{ fontWeight: '600', fontSize: 16, color: colors.text }}>
                                {item.studentName}
                              </ThemedText>
                              {isChanged && (
                                <ThemedText style={{ color: '#007AFF', fontSize: 10, fontWeight: '700', fontStyle: 'italic' }}>
                                  (Unsaved)
                                </ThemedText>
                              )}
                            </View>
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 2 }} numberOfLines={1}>
                              Roll No: {item.studentRollNumber || 'N/A'}
                            </ThemedText>
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                              Class: {item.studentClass}
                            </ThemedText>
                          </View>
                          
                          <View style={[styles.statusBadge, { 
                            backgroundColor: isSubmitted ? '#10b98120' : (activeTheme === 'dark' ? '#3f3f4680' : '#f4f4f5'),
                            borderColor: isSubmitted ? '#10b981' : colors.backgroundSelected
                          }]}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isSubmitted ? '#10b981' : colors.textSecondary, marginRight: 6 }} />
                            <ThemedText style={{ color: isSubmitted ? '#10b981' : colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                              {isSubmitted ? "Submitted" : "Pending"}
                            </ThemedText>
                          </View>
                        </View>

                        {(activeTab === 'active' || activeTab === 'overdue') && (
                          <TouchableOpacity 
                            style={[
                              styles.toggleStatusBtn, 
                              { 
                                backgroundColor: isSubmitted ? 'transparent' : '#007AFF',
                                borderColor: isSubmitted ? '#ef4444' : '#007AFF',
                              }
                            ]}
                            onPress={() => handleToggleSubmissionStatus(item)}
                          >
                            <Ionicons 
                              name={isSubmitted ? "close" : "checkmark"} 
                              size={16} 
                              color={isSubmitted ? '#ef4444' : '#FFF'} 
                            />
                            <ThemedText style={{ 
                              color: isSubmitted ? '#ef4444' : '#FFF', 
                              fontSize: 13, 
                              fontWeight: '700', 
                              marginLeft: 6 
                            }}>
                              {isSubmitted ? "Mark Pending" : "Mark Submitted"}
                            </ThemedText>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  }}
                />
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}>
            {(activeTab === 'active' || activeTab === 'overdue') && Object.keys(editedStatuses).length > 0 && (
              <Button 
                mode="outlined" 
                textColor={colors.textSecondary} 
                onPress={() => setSubmissionsVisible(false)}
                disabled={isSavingSubmissions}
                style={{ borderColor: colors.backgroundSelected, borderRadius: 10, flex: 1 }}
              >
                Cancel
              </Button>
            )}
            {(activeTab === 'active' || activeTab === 'overdue') && Object.keys(editedStatuses).length > 0 && (
              <Button 
                mode="contained" 
                buttonColor="#10b981" 
                textColor="#FFFFFF" 
                onPress={handleSaveBulkSubmissions} 
                loading={isSavingSubmissions}
                disabled={isSavingSubmissions}
                style={{ borderRadius: 10, flex: 2 }}
              >
                Save Changes ({Object.keys(editedStatuses).length})
              </Button>
            )}
            {(activeTab === 'completed' || Object.keys(editedStatuses).length === 0) && (
              <Button 
                mode="contained" 
                buttonColor="#007AFF" 
                textColor="#FFFFFF" 
                onPress={() => setSubmissionsVisible(false)} 
                style={{ borderRadius: 10, flex: 1 }}
              >
                Close
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Custom Alert Dialog */}
      <CustomAlert 
        {...alertConfig} 
        onDismiss={() => setAlertConfig(prev => ({ ...prev, visible: false }))} 
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  completeBtn: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  viewSubmissionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    height: 38,
  },
  viewSubmissionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    height: 44,
  },
  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  selectBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBtnContent: {
    justifyContent: 'center',
  },
  selectLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  selectValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  submissionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
});
