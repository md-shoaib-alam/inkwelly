import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, useWindowDimensions, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api, fetchAllStudents } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Portal, Dialog, Button, Avatar } from 'react-native-paper';
import { CustomAlert } from '@/components/ui/CustomAlert';

const TypedFlashList = FlashList as any;

interface ExamRecord {
  id: string;
  name: string;
  examType: string;
  status: string;
  totalMarks: number;
  passingMarks: number;
  subject?: { name: string };
  subjectName?: string;
}

interface StudentResultRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: string;
  remarks: string;
  status: 'pass' | 'fail' | 'pending';
}

interface ClassInfo {
  id: string;
  name: string;
  section: string;
}

const StudentResultCard = React.memo(({ item, index, selectedExam, colors, onUpdateMark, onUpdateRemarks }: any) => {
  return (
    <View style={[styles.studentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
      <View style={styles.studentInfoRow}>
        <ThemedText style={[styles.indexText, { color: colors.textSecondary }]}>{index + 1}</ThemedText>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <ThemedText style={{ fontWeight: '600', fontSize: 15, color: colors.text }}>{item.studentName}</ThemedText>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Roll No: {item.rollNumber}</ThemedText>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
        <TextInput
          placeholder="Marks"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={item.marksObtained}
          onChangeText={(val) => onUpdateMark(item.studentId, val)}
          editable={selectedExam.status !== 'completed'}
          style={[
            styles.marksInput,
            {
              color: colors.text,
              borderColor: item.status === 'pass' ? '#34C759' : item.status === 'fail' ? '#FF3B30' : colors.backgroundSelected,
              backgroundColor: colors.background,
              flex: 1,
            }
          ]}
        />
        <View style={{ 
          width: 80, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 8, 
          backgroundColor: item.marksObtained === '' || item.status === 'pending' ? colors.backgroundSelected : item.status === 'pass' ? '#34C75915' : '#FF3B3015' 
        }}>
          <ThemedText style={{ 
            color: item.marksObtained === '' || item.status === 'pending' ? colors.textSecondary : item.status === 'pass' ? '#34C759' : '#FF3B30', 
            fontWeight: '700', fontSize: 12, textTransform: 'uppercase' 
          }}>
            {item.marksObtained === '' || item.status === 'pending' ? 'PENDING' : item.status}
          </ThemedText>
        </View>
      </View>

      <TextInput
        placeholder="Optional Remarks"
        placeholderTextColor={colors.textSecondary}
        value={item.remarks}
        onChangeText={(val) => onUpdateRemarks(item.studentId, val)}
        editable={selectedExam.status !== 'completed'}
        style={[
          styles.remarksInput,
          {
            color: colors.text,
            borderColor: colors.backgroundSelected,
            backgroundColor: colors.background
          }
        ]}
      />
    </View>
  );
});

export default function ExamsEntryScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [resultRows, setResultRows] = useState<StudentResultRow[]>([]);

  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Dialog pickers and alerts
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [examPickerVisible, setExamPickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    showCancel?: boolean;
    confirmText?: string;
    confirmColor?: string;
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '' });

  const showAlert = useCallback((title: string, message: string, options?: Omit<typeof alertConfig, 'visible' | 'title' | 'message'>) => {
    setAlertConfig({ visible: true, title, message, ...options });
  }, []);

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId) || null, [classes, selectedClassId]);
  const selectedExam = useMemo(() => exams.find(e => e.id === selectedExamId) || null, [exams, selectedExamId]);

  // 1. Fetch Classes
  const fetchClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const data = await api.get<any>('/classes?all=true');
      setClasses(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // 2. Fetch Exams when Class changes
  const fetchExams = useCallback(async (classId: string) => {
    if (!classId) {
      setExams([]);
      setSelectedExamId('');
      setResultRows([]);
      return;
    }
    try {
      setLoadingExams(true);
      setSelectedExamId('');
      setResultRows([]);
      const data = await api.get<any>(`/exams?classId=${classId}&mine=true&limit=100`);
      const examsList = data?.data || (Array.isArray(data) ? data : []);
      setExams(examsList.filter((e: ExamRecord) => 
        e.status !== 'cancelled' && e.status !== 'completed'
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExams(false);
    }
  }, []);

  // 3. Fetch Students and Marks when Exam changes
  const fetchResults = useCallback(async (examId: string, classId: string) => {
    if (!examId || !classId) {
      setResultRows([]);
      return;
    }
    try {
      setLoadingStudents(true);
      const [studentsList, resultsList] = await Promise.all([
        fetchAllStudents({ classId }),
        api.get<any>(`/exams/results?examId=${examId}`).then(d => d.results || [])
      ]);

      const rows = studentsList.map((s: any) => {
        const match = resultsList.find((r: any) => r.studentId === s.id);
        return {
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber || 'N/A',
          marksObtained: match ? String(match.marksObtained) : '',
          remarks: match?.remarks || '',
          status: match ? match.status : 'pending',
        };
      });
      setResultRows(rows);
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to load class students and results.');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (selectedExamId && selectedClassId) {
        await fetchResults(selectedExamId, selectedClassId);
      } else if (selectedClassId) {
        await fetchExams(selectedClassId);
      } else {
        await fetchClasses();
      }
    } finally {
      setRefreshing(false);
    }
  }, [selectedExamId, selectedClassId, fetchResults, fetchExams, fetchClasses]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    fetchExams(classId);
  };

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    fetchResults(examId, selectedClassId);
  };

  const handleUpdateMark = useCallback((studentId: string, val: string) => {
    if (!selectedExam) return;

    setResultRows((prevRows) => prevRows.map((row) => {
      if (row.studentId !== studentId) return row;

      if (val === '') {
        return { ...row, marksObtained: '', status: 'pending' };
      }

      const num = parseFloat(val);
      if (isNaN(num)) {
        // Allow temporary invalid chars like trailing decimal "4."
        return { ...row, marksObtained: val };
      }
      if (num < 0) return row;
      if (num > selectedExam.totalMarks) {
        showAlert('Warning', `Marks cannot exceed total (${selectedExam.totalMarks})!`);
        return row;
      }

      const isPass = num >= selectedExam.passingMarks;
      return {
        ...row,
        marksObtained: val,
        status: isPass ? 'pass' : 'fail',
      };
    }));
  }, [selectedExam, showAlert]);

  const handleUpdateRemarks = useCallback((studentId: string, val: string) => {
    setResultRows((prevRows) => prevRows.map((row) => {
      if (row.studentId === studentId) {
        return { ...row, remarks: val };
      }
      return row;
    }));
  }, []);

  const handleSaveDraft = async () => {
    if (!selectedExamId) return;
    setSavingResults(true);
    try {
      await api.post('/exams/results', {
        examId: selectedExamId,
        results: resultRows.reduce((acc, r) => {
          if (r.marksObtained.trim() !== '') {
            acc.push({
              studentId: r.studentId,
              marksObtained: parseFloat(r.marksObtained),
              status: r.status,
              remarks: r.remarks || null,
            });
          }
          return acc;
        }, [] as any[]),
      });
      showAlert('Success', 'Exam marks draft saved successfully!');
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to save marks draft.');
    } finally {
      setSavingResults(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedExam) return;

    const hasPending = resultRows.some((r) => r.marksObtained.trim() === '');
    const confirmMessage = hasPending
      ? 'Some students are missing marks. Do you want to publish the results anyway?'
      : 'Publishing will finalize the results and lock them for student viewing. Continue?';

    showAlert('Publish Results', confirmMessage, {
      showCancel: true,
      confirmText: 'Publish',
      confirmColor: '#FF3B30',
      onConfirm: async () => {
        setIsPublishing(true);
        try {
          await api.post('/exams/results', {
            examId: selectedExam.id,
            results: resultRows.reduce((acc, r) => {
              if (r.marksObtained.trim() !== '') {
                acc.push({
                  studentId: r.studentId,
                  marksObtained: parseFloat(r.marksObtained),
                  status: r.status,
                  remarks: r.remarks || null,
                });
              }
              return acc;
            }, [] as any[]),
          });

          await api.put('/exams', {
            id: selectedExam.id,
            status: 'completed',
          });

          showAlert('Success', 'Exam results successfully published!');
          setExams(prev => prev.map((e) =>
            e.id === selectedExam.id ? { ...e, status: 'completed' } : e
          ));
        } catch (e) {
          console.error(e);
          showAlert('Error', 'Failed to publish results.');
        } finally {
          setIsPublishing(false);
        }
      }
    });
  };

  const summary = useMemo(() => {
    const total = resultRows.length;
    const pass = resultRows.filter(r => r.status === 'pass').length;
    const fail = resultRows.filter(r => r.status === 'fail').length;
    const pending = resultRows.filter(r => r.status === 'pending').length;
    return { total, pass, fail, pending };
  }, [resultRows]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <ThemedView style={styles.container}>
      {/* Selector Row */}
      <View style={[styles.selectorBar, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
        <TouchableOpacity
          style={[styles.selectBtn, { borderColor: colors.backgroundSelected, backgroundColor: 'transparent' }]}
          onPress={() => setClassPickerVisible(true)}
        >
          <Ionicons name="school-outline" size={16} color="#007AFF" />
          <View style={{ flex: 1, marginHorizontal: 4 }}>
            <ThemedText style={styles.selectBtnText} numberOfLines={1}>
              {selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'Select Class'}
            </ThemedText>
          </View>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectBtn, { borderColor: colors.backgroundSelected, backgroundColor: 'transparent' }]}
          onPress={() => {
            if (!selectedClassId) {
              showAlert('Warning', 'Please select a class first to load its exams.');
            } else {
              setExamPickerVisible(true);
            }
          }}
        >
          <Ionicons name="document-text-outline" size={16} color="#34C759" />
          <View style={{ flex: 1, marginHorizontal: 4 }}>
            <ThemedText style={styles.selectBtnText} numberOfLines={1}>
              {selectedExam ? selectedExam.name : 'Select Exam'}
            </ThemedText>
          </View>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loadingClasses || loadingExams ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : !selectedExam ? (
        <ScrollView 
          contentContainerStyle={styles.center}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}
        >
          <Ionicons name="book-outline" size={64} color={colors.backgroundSelected} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }}>
            {selectedClassId ? 'Please select an exam to start entering results.' : 'Choose a class at the top to load available exams.'}
          </ThemedText>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Student Scoring List */}
          {loadingStudents ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <TypedFlashList
                data={resultRows}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}
                keyExtractor={(item: any) => item.studentId}
                contentContainerStyle={styles.listContent}
                estimatedItemSize={80}
                ListHeaderComponent={
                  <View style={{ paddingBottom: 8 }}>
                    {/* Exam Info Card */}
                    <View style={[styles.examCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                      <View style={styles.examCardHeader}>
                        <ThemedText style={styles.examTitle}>{selectedExam.name}</ThemedText>
                        <View style={[styles.badge, { backgroundColor: selectedExam.status === 'completed' ? '#34C75915' : '#FF950015' }]}>
                          <ThemedText style={{ color: selectedExam.status === 'completed' ? '#34C759' : '#FF9500', fontSize: 10, fontWeight: '700' }}>
                            {selectedExam.status === 'completed' ? 'PUBLISHED' : 'DRAFT'}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                        Subject: <ThemedText style={{ fontWeight: 'bold' }}>{selectedExam.subject?.name || selectedExam.subjectName || 'N/A'}</ThemedText> | Type: <ThemedText style={{ fontWeight: 'bold' }}>{selectedExam.examType.toUpperCase()}</ThemedText>
                      </ThemedText>
                      <View style={[styles.cardDivider, { backgroundColor: colors.backgroundSelected }]} />
                      <View style={styles.examMetaRow}>
                        <ThemedText style={[styles.examMetaText, { color: colors.textSecondary }]}>
                          Total Marks: <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{selectedExam.totalMarks}</ThemedText>
                        </ThemedText>
                        <ThemedText style={[styles.examMetaText, { color: colors.textSecondary }]}>
                          Passing Marks: <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{selectedExam.passingMarks}</ThemedText>
                        </ThemedText>
                      </View>
                    </View>

                    {/* Results Summary Row */}
                    <View style={styles.summaryRow}>
                      <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, width: isLargeScreen ? '23%' : '48%' }]}>
                        <ThemedText style={styles.summaryValue}>{summary.total}</ThemedText>
                        <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Students</ThemedText>
                      </View>
                      <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, width: isLargeScreen ? '23%' : '48%' }]}>
                        <ThemedText style={[styles.summaryValue, { color: '#34C759' }]}>{summary.pass}</ThemedText>
                        <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Passed</ThemedText>
                      </View>
                      <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, width: isLargeScreen ? '23%' : '48%' }]}>
                        <ThemedText style={[styles.summaryValue, { color: '#FF3B30' }]}>{summary.fail}</ThemedText>
                        <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Failed</ThemedText>
                      </View>
                      <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, width: isLargeScreen ? '23%' : '48%' }]}>
                        <ThemedText style={[styles.summaryValue, { color: '#FF9500' }]}>{summary.pending}</ThemedText>
                        <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</ThemedText>
                      </View>
                    </View>

                    {/* Action Row */}
                    {selectedExam.status !== 'completed' && resultRows.length > 0 && (
                      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 12 }}>
                        <Button
                          mode="outlined"
                          textColor={colors.textSecondary}
                          onPress={handleSaveDraft}
                          disabled={savingResults || isPublishing}
                          style={{ borderColor: colors.backgroundSelected, borderRadius: 8, flex: 1 }}
                        >
                          Save Draft
                        </Button>
                        <Button
                          mode="contained"
                          buttonColor="#34C759"
                          textColor="#FFF"
                          onPress={handlePublish}
                          disabled={savingResults || isPublishing}
                          style={{ borderRadius: 8, flex: 1 }}
                        >
                          Publish
                        </Button>
                      </View>
                    )}
                  </View>
                }
                renderItem={({ item, index }: any) => (
                  <StudentResultCard
                    item={item}
                    index={index}
                    selectedExam={selectedExam}
                    colors={colors}
                    onUpdateMark={handleUpdateMark}
                    onUpdateRemarks={handleUpdateRemarks}
                  />
                )}
              />
            </View>
          )}
        </View>
      )}

      {/* Class Picker */}
      <Portal>
        <Dialog
          visible={classPickerVisible}
          onDismiss={() => setClassPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, maxWidth: 320, width: '80%', alignSelf: 'center', borderRadius: 16 }}
        >
          <Dialog.Title style={{ color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>Select Class</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView style={{ maxHeight: 300 }}>
              {classes.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    handleClassChange(c.id);
                    setClassPickerVisible(false);
                  }}
                >
                  <ThemedText style={{ color: selectedClassId === c.id ? '#007AFF' : colors.text }}>
                    {c.name} - {c.section}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>

      {/* Exam Picker */}
      <Portal>
        <Dialog
          visible={examPickerVisible}
          onDismiss={() => setExamPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, maxWidth: 320, width: '80%', alignSelf: 'center', borderRadius: 16 }}
        >
          <Dialog.Title style={{ color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>Select Exam</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView style={{ maxHeight: 300 }}>
              {exams.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    handleExamChange(e.id);
                    setExamPickerVisible(false);
                  }}
                >
                  <ThemedText style={{ color: selectedExamId === e.id ? '#007AFF' : colors.text }}>
                    {e.name} ({e.examType.toUpperCase()})
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
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
  selectorBar: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  selectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    height: 38,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  examCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examTitle: {
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
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  examMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  examMetaText: {
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  studentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
    marginRight: 6,
  },
  marksInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  remarksInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 36,
    paddingHorizontal: 10,
    marginTop: 8,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
});
