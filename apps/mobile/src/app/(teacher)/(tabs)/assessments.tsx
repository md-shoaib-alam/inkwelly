import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api, fetchAllStudents } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useAuth } from '@/store/auth-context';
import { Portal, Dialog, Button, HelperText } from 'react-native-paper';

const TypedFlashList = FlashList as any;

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

interface Assessment {
  id: string;
  title: string;
  type: string;
  totalMarks: number;
  passingMarks: number;
  status: 'active' | 'completed';
  classId: string;
  subjectId: string;
  subject?: { name: string };
  class?: { id: string; name: string; section: string };
}

interface Student {
  id: string;
  rollNumber: string;
  user?: {
    name: string;
  };
}

interface GradeRecord {
  id: string;
  studentId: string;
  marksObtained: number;
}

export default function AssessmentsScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [activeAssessments, setActiveAssessments] = useState<Assessment[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  // Animated sliding indicators and layouts
  const [layoutWidth, setLayoutWidth] = useState(360);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const scrollViewRef = React.useRef<ScrollView | null>(null);

  // Bootstrap data
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);

  // Create Form State
  const [createVisible, setCreateVisible] = useState(false);
  const [formClassId, setFormClassId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('unit_test');
  const [formTotalMarks, setFormTotalMarks] = useState('100');
  const [formPassingMarks, setFormPassingMarks] = useState('33');
  const [isCreating, setIsCreating] = useState(false);

  // Record Grades State
  const [gradesVisible, setGradesVisible] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Pickers
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [typePickerVisible, setTypePickerVisible] = useState(false);

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const [resActive, resCompleted] = await Promise.all([
        api.get('/assessments?status=active').catch(() => []),
        api.get('/assessments?status=completed').catch(() => [])
      ]);
      setActiveAssessments(Array.isArray(resActive) ? resActive : []);
      setCompletedAssessments(Array.isArray(resCompleted) ? resCompleted : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const onLayout = (event: any) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  const handleTabPress = (tab: 'active' | 'completed') => {
    setActiveTab(tab);
    if (scrollViewRef.current) {
      const index = tab === 'active' ? 0 : 1;
      scrollViewRef.current.scrollTo({ x: index * layoutWidth, animated: true });
    }
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / layoutWidth);
    const newTab = index === 0 ? 'active' : 'completed';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  // Load classes & subjects for create modal
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
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Please enter an assessment title.');
      return;
    }
    if (!formClassId || !formSubjectId) {
      Alert.alert('Error', 'Please select both Class and Subject.');
      return;
    }

    try {
      setIsCreating(true);
      await api.post('/assessments', {
        classId: formClassId,
        subjectId: formSubjectId,
        title: formTitle.trim(),
        type: formType,
        totalMarks: formTotalMarks,
        passingMarks: formPassingMarks
      });
      setCreateVisible(false);
      setFormTitle('');
      fetchAssessments();
      Alert.alert('Success', 'Assessment created successfully!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create assessment.');
    } finally {
      setIsCreating(false);
    }
  };

  // Record Grades Loader
  const openGradesDialog = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setGradesVisible(true);
    setLoadingGrades(true);
    setMarks({});
    try {
      const [resStudents, resGrades] = await Promise.all([
        fetchAllStudents({ classId: assessment.classId }),
        api.get(`/assessments/${assessment.id}/grades`).catch(() => [])
      ]);
      const studentList = resStudents;
      setStudents(studentList);

      const existingMarks: Record<string, string> = {};
      if (Array.isArray(resGrades)) {
        resGrades.forEach((g: GradeRecord) => {
          existingMarks[g.studentId] = g.marksObtained.toString();
        });
      }
      setMarks(existingMarks);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load students or grades.');
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedAssessment) return;
    setIsSavingGrades(true);
    try {
      const records = Object.entries(marks).reduce((acc, [studentId, val]) => {
        if (val.trim() !== '') {
          acc.push({
            studentId,
            marksObtained: parseFloat(val),
            remarks: ''
          });
        }
        return acc;
      }, [] as any[]);

      if (records.length === 0) {
        Alert.alert('Error', 'No marks entered to save!');
        setIsSavingGrades(false);
        return;
      }

      // Validate grades against total marks
      const invalid = records.find(r => r.marksObtained > selectedAssessment.totalMarks);
      if (invalid) {
        Alert.alert('Error', `Marks cannot exceed total marks (${selectedAssessment.totalMarks})`);
        setIsSavingGrades(false);
        return;
      }

      await api.post('/assessments/bulk-grades', {
        assessmentId: selectedAssessment.id,
        records
      });
      Alert.alert('Success', 'Grades saved successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save grades.');
    } finally {
      setIsSavingGrades(false);
    }
  };

  const handleFinalize = () => {
    if (!selectedAssessment) return;
    Alert.alert(
      'Finalize Assessment',
      'Are you sure you want to finalize this assessment? This will publish grades to parents/students and lock editing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          onPress: async () => {
            setIsFinalizing(true);
            try {
              await api.put(`/assessments/${selectedAssessment.id}/complete`, {});
              setGradesVisible(false);
              fetchAssessments();
              Alert.alert('Success', 'Assessment finalized successfully!');
            } catch (e) {
              Alert.alert('Error', 'Failed to finalize assessment.');
            } finally {
              setIsFinalizing(false);
            }
          }
        }
      ]
    );
  };

  const selectedClass = classes.find(c => c.id === formClassId);
  const selectedSubject = filteredSubjects.find(s => s.id === formSubjectId);

  const getAssessmentTypeLabel = (type: string) => {
    switch (type) {
      case 'unit_test': return 'Unit Test';
      case 'quiz': return 'Quiz';
      case 'practical': return 'Practical';
      case 'assignment': return 'Assignment';
      case 'final_exam': return 'Final Exam';
      default: return type.toUpperCase();
    }
  };

  const translateX = scrollX.interpolate({
    inputRange: [0, layoutWidth * 2],
    outputRange: [0, layoutWidth],
    extrapolate: 'clamp',
  });

  return (
    <ThemedView style={styles.container} onLayout={onLayout}>
      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.backgroundSelected }]}>
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => handleTabPress('active')}
        >
          <ThemedText style={{ color: activeTab === 'active' ? '#007AFF' : colors.textSecondary, fontWeight: '700' }}>Active</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => handleTabPress('completed')}
        >
          <ThemedText style={{ color: activeTab === 'completed' ? '#34C759' : colors.textSecondary, fontWeight: '700' }}>Finalized</ThemedText>
        </TouchableOpacity>
        <Animated.View style={[styles.tabIndicator, { 
          width: layoutWidth / 2, 
          transform: [{ translateX }], 
          backgroundColor: activeTab === 'completed' ? '#34C759' : '#007AFF' 
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
          {/* Active Assessments */}
          <View style={{ width: layoutWidth }}>
            <TypedFlashList
              data={activeAssessments}
              keyExtractor={(item: Assessment) => item.id}
              contentContainerStyle={styles.listContent}
              estimatedItemSize={120}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="clipboard-outline" size={64} color={colors.backgroundSelected} />
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No active assessments found.</ThemedText>
                </View>
              }
              renderItem={({ item }: { item: Assessment }) => (
                <TouchableOpacity 
                  style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
                  onPress={() => openGradesDialog(item)}
                >
                  <View style={styles.cardHeader}>
                    <ThemedText style={styles.titleText}>{item.title}</ThemedText>
                    <View style={[styles.badge, { backgroundColor: '#007AFF15' }]}>
                      <ThemedText style={{ color: '#007AFF', fontSize: 10, fontWeight: '700' }}>
                        {getAssessmentTypeLabel(item.type)}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.metaBadge}>
                      <Ionicons name="school-outline" size={12} color={colors.textSecondary} />
                      <ThemedText style={styles.metaText}>
                        {item.class ? `${item.class.name}-${item.class.section}` : 'Class'}
                      </ThemedText>
                    </View>
                    <View style={styles.metaBadge}>
                      <Ionicons name="book-outline" size={12} color={colors.textSecondary} />
                      <ThemedText style={styles.metaText}>
                        {item.subject ? item.subject.name : 'Subject'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: colors.backgroundSelected }]}>
                    <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                      Total Marks: <ThemedText style={{ fontWeight: 'bold' }}>{item.totalMarks}</ThemedText> | Passing Marks: <ThemedText style={{ fontWeight: 'bold' }}>{item.passingMarks}</ThemedText>
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Finalized Assessments */}
          <View style={{ width: layoutWidth }}>
            <TypedFlashList
              data={completedAssessments}
              keyExtractor={(item: Assessment) => item.id}
              contentContainerStyle={styles.listContent}
              estimatedItemSize={120}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={64} color={colors.backgroundSelected} />
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No finalized assessments found.</ThemedText>
                </View>
              }
              renderItem={({ item }: { item: Assessment }) => (
                <TouchableOpacity 
                  style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
                  onPress={() => openGradesDialog(item)}
                >
                  <View style={styles.cardHeader}>
                    <ThemedText style={styles.titleText}>{item.title}</ThemedText>
                    <View style={[styles.badge, { backgroundColor: '#34C75915' }]}>
                      <ThemedText style={{ color: '#34C759', fontSize: 10, fontWeight: '700' }}>
                        {getAssessmentTypeLabel(item.type)}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.metaBadge}>
                      <Ionicons name="school-outline" size={12} color={colors.textSecondary} />
                      <ThemedText style={styles.metaText}>
                        {item.class ? `${item.class.name}-${item.class.section}` : 'Class'}
                      </ThemedText>
                    </View>
                    <View style={styles.metaBadge}>
                      <Ionicons name="book-outline" size={12} color={colors.textSecondary} />
                      <ThemedText style={styles.metaText}>
                        {item.subject ? item.subject.name : 'Subject'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: colors.backgroundSelected }]}>
                    <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                      Total Marks: <ThemedText style={{ fontWeight: 'bold' }}>{item.totalMarks}</ThemedText> | Passing Marks: <ThemedText style={{ fontWeight: 'bold' }}>{item.passingMarks}</ThemedText>
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
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
            Add Assessment
          </Dialog.Title>
          <Dialog.Content style={{ paddingHorizontal: 20 }}>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              
              {/* Assessment Title Input */}
              <View style={[styles.inputContainer, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}>
                <Ionicons name="create-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Assessment Title"
                  placeholderTextColor={colors.textSecondary}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  style={[styles.inputField, { color: colors.text }]}
                />
              </View>

              {/* Class Selector */}
              <TouchableOpacity 
                style={[styles.selectBtn, { borderColor: colors.backgroundSelected, backgroundColor: colors.background, marginTop: 12 }]} 
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
                style={[styles.selectBtn, { borderColor: colors.backgroundSelected, backgroundColor: colors.background, marginTop: 12 }]} 
                onPress={() => formClassId ? setSubjectPickerVisible(true) : Alert.alert('Warning', 'Please select a class first')}
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

              {/* Type Selector */}
              <TouchableOpacity 
                style={[styles.selectBtn, { borderColor: colors.backgroundSelected, backgroundColor: colors.background, marginTop: 12 }]} 
                onPress={() => setTypePickerVisible(true)}
              >
                <View style={styles.selectBtnLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: '#AF52DE15' }]}>
                    <Ionicons name="list-outline" size={18} color="#AF52DE" />
                  </View>
                  <View style={styles.selectBtnContent}>
                    <ThemedText style={styles.selectLabel}>Type</ThemedText>
                    <ThemedText style={[styles.selectValue, { color: colors.text }]}>
                      {getAssessmentTypeLabel(formType)}
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.row, { marginTop: 12, gap: 12 }]}>
                {/* Total Marks Input */}
                <View style={[styles.inputContainer, { borderColor: colors.backgroundSelected, backgroundColor: colors.background, flex: 1 }]}>
                  <TextInput
                    placeholder="Total Marks"
                    placeholderTextColor={colors.textSecondary}
                    value={formTotalMarks}
                    onChangeText={setFormTotalMarks}
                    keyboardType="numeric"
                    style={[styles.inputField, { color: colors.text }]}
                  />
                </View>
                
                {/* Passing Marks Input */}
                <View style={[styles.inputContainer, { borderColor: colors.backgroundSelected, backgroundColor: colors.background, flex: 1 }]}>
                  <TextInput
                    placeholder="Passing Marks"
                    placeholderTextColor={colors.textSecondary}
                    value={formPassingMarks}
                    onChangeText={setFormPassingMarks}
                    keyboardType="numeric"
                    style={[styles.inputField, { color: colors.text }]}
                  />
                </View>
              </View>
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
                    style={styles.pickerItem}
                    onPress={() => {
                      setFormClassId(item.id);
                      setClassPickerVisible(false);
                    }}
                  >
                    <ThemedText style={{ color: formClassId === item.id ? '#007AFF' : colors.text }}>
                      {item.name} - {item.section}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Dialog.ScrollArea>
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
                    style={styles.pickerItem}
                    onPress={() => {
                      setFormSubjectId(item.id);
                      setSubjectPickerVisible(false);
                    }}
                  >
                    <ThemedText style={{ color: formSubjectId === item.id ? '#007AFF' : colors.text }}>
                      {item.name}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>

      {/* Type Picker */}
      <Portal>
        <Dialog 
          visible={typePickerVisible} 
          onDismiss={() => setTypePickerVisible(false)} 
          style={{ backgroundColor: colors.backgroundElement, maxWidth: 400, width: '90%', alignSelf: 'center' }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Type</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            {['unit_test', 'quiz', 'practical', 'assignment', 'final_exam'].map((t) => (
              <TouchableOpacity 
                key={t}
                style={styles.pickerItem}
                onPress={() => {
                  setFormType(t);
                  setTypePickerVisible(false);
                }}
              >
                <ThemedText style={{ color: formType === t ? '#007AFF' : colors.text }}>
                  {getAssessmentTypeLabel(t)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>

      {/* Record Grades Modal Dialog */}
      <Portal>
        <Dialog 
          visible={gradesVisible} 
          onDismiss={() => setGradesVisible(false)} 
          style={{ backgroundColor: colors.backgroundElement, maxWidth: 450, width: '92%', alignSelf: 'center' }}
        >
          <Dialog.Title style={{ color: colors.text, fontSize: 18 }}>
            {selectedAssessment ? `${selectedAssessment.title} (${selectedAssessment.totalMarks} Marks)` : 'Record Scores'}
          </Dialog.Title>
          <Dialog.Content style={{ paddingHorizontal: 0 }}>
            {loadingGrades ? (
              <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : (
              <View style={{ height: 300, width: '100%' }}>
                <TypedFlashList
                  data={students}
                  keyExtractor={(item: Student) => item.id}
                  estimatedItemSize={60}
                  renderItem={({ item, index }: { item: Student, index: number }) => (
                    <View style={[styles.studentRow, { borderBottomColor: colors.backgroundSelected }]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.studentNameText}>{item.user?.name || 'Student'}</ThemedText>
                        <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>Roll No: {item.rollNumber}</ThemedText>
                      </View>
                      <TextInput
                        placeholder="Marks"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        editable={selectedAssessment?.status !== 'completed'}
                        value={marks[item.id] || ''}
                        onChangeText={(text) => {
                          setMarks(prev => ({ ...prev, [item.id]: text }));
                        }}
                        style={[styles.scoreInput, { 
                          color: colors.text, 
                          borderColor: colors.backgroundSelected, 
                          backgroundColor: colors.background 
                        }]}
                      />
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={styles.center}>
                      <ThemedText style={{ color: colors.textSecondary }}>No students found in this class.</ThemedText>
                    </View>
                  }
                />
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions style={{ flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 }}>
            <Button textColor={colors.textSecondary} onPress={() => setGradesVisible(false)}>Close</Button>
            {selectedAssessment?.status !== 'completed' && (
              <>
                <Button 
                  textColor="#34C759" 
                  disabled={loadingGrades || isSavingGrades} 
                  onPress={handleSaveGrades}
                >
                  Save Marks
                </Button>
                <Button 
                  textColor="#FF3B30" 
                  disabled={loadingGrades || isFinalizing} 
                  onPress={handleFinalize}
                >
                  Finalize
                </Button>
              </>
            )}
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
    padding: 20
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
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreInput: {
    width: 70,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
  }
});
