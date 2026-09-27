import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { StudentProfile, GradeRecord } from '@/types';

interface AcademicYear { id: string; name: string; [key: string]: any; }
interface Exam { id: string; name: string; [key: string]: any; }

export default function StudentReportCardScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Exams / Report Cards state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [marksheetType, setMarksheetType] = useState<'midterm' | 'final'>('midterm');
  const [exams, setExams] = useState<Exam[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, any[]>>({});

  // Slide Animation for Term Selector
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const buttonWidth = (SCREEN_WIDTH - 32 - 4) / 2;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: marksheetType === 'midterm' ? 0 : 1,
      useNativeDriver: true,
      tension: 140,
      friction: 12,
    }).start();
  }, [marksheetType]);

  const fetchYears = useCallback(async () => {
    try {
      const years = await api.get<any>('/academic-years');
      setAcademicYears(years || []);
      const currentYear = years.find((y: any) => y.isCurrent) || years[0];
      if (currentYear) {
        setSelectedYear(currentYear.name);
      }
    } catch (err) {
      console.error('Failed to load academic years:', err);
    }
  }, []);

  const fetchStudentContext = useCallback(async () => {
    try {
      const studentMe = await api.get<any>('/students/me');
      setProfile(studentMe);
    } catch (err) {
      console.error('Failed to fetch student context:', err);
    }
  }, []);

  const fetchExamsAndResults = useCallback(async () => {
    if (!profile || !selectedYear) return;
    try {
      const examsRes = await api.get<any>('/exams', { params: { classId: profile.classId, limit: 100 } });
      const completedExams = (examsRes.data || examsRes || []).filter(
        (e: any) => e.status === 'completed' && e.academicYear === selectedYear
      );
      setExams(completedExams);

      let currentResultsMap: Record<string, any[]> = {};
      if (completedExams.length > 0) {
        const resultsArr = await Promise.all(
          completedExams.map(async (exam: any) => {
            try {
              const r = await api.get<any>(`/exams/results`, { params: { examId: exam.id } });
              return { examId: exam.id, results: r.results || [] };
            } catch {
              return { examId: exam.id, results: [] };
            }
          })
        );
        resultsArr.forEach((item: any) => {
          currentResultsMap[item.examId] = item.results;
        });
        setResultsMap(currentResultsMap);
      }
    } catch (error) {
      console.error('Failed to load exams and results:', error);
    }
  }, [profile, selectedYear]);

  // Load everything
  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchYears();
      await fetchStudentContext();
      setLoading(false);
    }
    init();
  }, [fetchYears, fetchStudentContext]);

  // Sync exams when profile or year changes
  useEffect(() => {
    if (profile && selectedYear) {
      fetchExamsAndResults();
    }
  }, [profile, selectedYear, fetchExamsAndResults]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchYears();
    await fetchStudentContext();
    if (profile && selectedYear) {
      await fetchExamsAndResults();
    }
    setRefreshing(false);
  };

  // Compute marksheet
  const marksheet = useMemo(() => {
    if (!profile || exams.length === 0) return null;

    // Build unique subjects
    const subjectsMap = new Map<string, string>();
    exams.forEach(e => {
      if (e.subjectId) subjectsMap.set(e.subjectId, e.subjectName);
    });

    let totalMax = 0;
    let totalObtained = 0;
    let hasFail = false;
    let hasPending = false;

    const rows = Array.from(subjectsMap.entries()).map(([subId, subName]) => {
      const activeExam = exams.find(e => e.subjectId === subId && e.examType === marksheetType);
      const resList = activeExam ? resultsMap[activeExam.id] || [] : [];
      const studentResult = resList.find((r: any) => r.studentId === profile.id);

      const obtained = studentResult ? Number(studentResult.marksObtained) : null;
      const maxMarks = activeExam?.totalMarks || 0;
      const passing = activeExam?.passingMarks || 0;
      const status = studentResult ? studentResult.status : 'pending';

      if (maxMarks > 0) {
        totalMax += maxMarks;
        totalObtained += (obtained ?? 0);
        if (status === 'fail') hasFail = true;
        if (status === 'pending') hasPending = true;
      }

      const pct = maxMarks > 0 ? Math.round(((obtained ?? 0) / maxMarks) * 100) : 0;
      let grade = 'N/A';
      if (obtained !== null) {
        if (pct >= 90) grade = 'A+';
        else if (pct >= 80) grade = 'A';
        else if (pct >= 70) grade = 'B';
        else if (pct >= 60) grade = 'C';
        else if (pct >= 50) grade = 'D';
        else grade = 'F';
      }

      return {
        subjectName: subName,
        obtained,
        maxMarks,
        passing,
        percentage: pct,
        grade,
        status
      };
    });

    const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    let overallGrade = 'N/A';
    if (totalMax > 0) {
      if (overallPct >= 90) overallGrade = 'A+';
      else if (overallPct >= 80) overallGrade = 'A';
      else if (overallPct >= 70) overallGrade = 'B';
      else if (overallPct >= 60) overallGrade = 'C';
      else if (overallPct >= 50) overallGrade = 'D';
      else overallGrade = 'F';
    }

    const overallStatus = hasPending ? 'pending' : (hasFail || overallPct < 40) ? 'fail' : 'pass';

    return {
      rows,
      totalMax,
      totalObtained,
      overallPct,
      overallGrade,
      overallStatus
    };
  }, [profile, exams, resultsMap, marksheetType]);

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
        }
      >
        <View>
          {/* Year & Term Selectors */}
          <View style={styles.selectorsRow}>
            <View style={styles.pickerWrapper}>
              <ThemedText style={[styles.pickerLabel, { color: colors.textSecondary }]}>Academic Year</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
                {academicYears.map(y => {
                  const isSelected = selectedYear === y.name;
                  return (
                    <TouchableOpacity 
                      key={y.id} 
                      style={[
                        styles.badgeBtn, 
                        { 
                          backgroundColor: isSelected ? '#007AFF' : colors.backgroundElement, 
                          borderColor: isSelected ? '#007AFF' : colors.backgroundSelected 
                        }
                      ]}
                      onPress={() => setSelectedYear(y.name)}
                    >
                      <ThemedText style={[styles.badgeText, { color: isSelected ? '#FFF' : colors.text }]}>{y.name}</ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={[styles.pickerWrapper, { marginTop: 14 }]}>
              <ThemedText style={[styles.pickerLabel, { color: colors.textSecondary }]}>Term / Exam Type</ThemedText>
              <View style={[styles.termSelector, { backgroundColor: activeTheme === 'light' ? 'rgba(120, 120, 128, 0.08)' : 'rgba(120, 120, 128, 0.16)' }]}>
                {/* Sliding indicator */}
                <Animated.View 
                  style={[
                    styles.slidingBg, 
                    {
                      width: buttonWidth,
                      transform: [{
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, buttonWidth],
                        })
                      }]
                    }
                  ]}
                />
                <TouchableOpacity 
                  style={styles.termBtn}
                  onPress={() => setMarksheetType('midterm')}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.termText, { color: marksheetType === 'midterm' ? '#FFF' : colors.textSecondary }]}>Midterm</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.termBtn}
                  onPress={() => setMarksheetType('final')}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.termText, { color: marksheetType === 'final' ? '#FFF' : colors.textSecondary }]}>Final</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Marksheet Rendering */}
          {!marksheet || marksheet.rows.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={48} color={colors.textSecondary} />
              <ThemedText style={{ marginTop: 12, color: colors.textSecondary, textAlign: 'center' }}>
                No published exam results found for {selectedYear || 'this year'}.
              </ThemedText>
            </View>
          ) : (
            <View>
              {/* Premium Overall Summary Card */}
              <LinearGradient
                colors={activeTheme === 'dark' ? ['#1A213D', '#12162B'] : ['#007AFF', '#0056B3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <View style={styles.radialSummary}>
                  <ThemedText style={styles.radialScore}>{marksheet.overallPct}%</ThemedText>
                  <ThemedText style={styles.radialLabel}>Average</ThemedText>
                </View>
                <View style={styles.summaryMeta}>
                  <ThemedText style={styles.summaryTitle}>Exam Performance</ThemedText>
                  <View style={styles.metaBadgeRow}>
                    <View style={styles.metaBadge}>
                      <ThemedText style={styles.metaBadgeText}>Grade: {marksheet.overallGrade}</ThemedText>
                    </View>
                    <View style={[
                      styles.metaBadge, 
                      marksheet.overallStatus === 'pass' ? { backgroundColor: 'rgba(52,199,89,0.2)' } : marksheet.overallStatus === 'fail' ? { backgroundColor: 'rgba(255,59,48,0.2)' } : { backgroundColor: 'rgba(255,149,0,0.2)' }
                    ]}>
                      <ThemedText style={[
                        styles.metaBadgeText,
                        marksheet.overallStatus === 'pass' ? { color: '#34C759' } : marksheet.overallStatus === 'fail' ? { color: '#FF3B30' } : { color: '#FF9500' }
                      ]}>
                        {marksheet.overallStatus.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.summaryFootnote}>
                    Marks: {marksheet.totalObtained} / {marksheet.totalMax}
                  </ThemedText>
                </View>
              </LinearGradient>

              {/* Subjects Table/List */}
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Subject Details</ThemedText>
              {marksheet.rows.map((row, index) => (
                <View key={index} style={[styles.subjectRow, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.backgroundSelected }]}>
                  <View style={styles.subjectHeader}>
                    <ThemedText style={styles.subjName}>{row.subjectName}</ThemedText>
                    <ThemedText style={[styles.gradeTag, { color: row.status === 'pass' ? '#34C759' : row.status === 'fail' ? '#FF3B30' : '#FF9500' }]}>
                      Grade {row.grade}
                    </ThemedText>
                  </View>

                  <View style={styles.subjectScores}>
                    <View style={styles.scoreItem}>
                      <ThemedText style={[styles.scoreLabel, { color: colors.textSecondary }]}>Marks</ThemedText>
                      <ThemedText style={styles.scoreVal}>{row.obtained !== null ? `${row.obtained}/${row.maxMarks}` : 'N/A'}</ThemedText>
                    </View>
                    <View style={styles.scoreItem}>
                      <ThemedText style={[styles.scoreLabel, { color: colors.textSecondary }]}>Passing</ThemedText>
                      <ThemedText style={styles.scoreVal}>{row.passing}</ThemedText>
                    </View>
                    <View style={styles.scoreItem}>
                      <ThemedText style={[styles.scoreLabel, { color: colors.textSecondary }]}>Percentage</ThemedText>
                      <ThemedText style={styles.scoreVal}>{row.percentage}%</ThemedText>
                    </View>
                    <View style={styles.scoreItem}>
                      <ThemedText style={[styles.scoreLabel, { color: colors.textSecondary }]}>Result</ThemedText>
                      <ThemedText style={[styles.scoreVal, { color: row.status === 'pass' ? '#34C759' : row.status === 'fail' ? '#FF3B30' : '#FF9500' }]}>
                        {row.status.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  selectorsRow: {
    marginBottom: 16,
  },
  pickerWrapper: {
    width: '100%',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  badgeScroll: {
    gap: 8,
  },
  badgeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  termSelector: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: 10,
    position: 'relative',
  },
  slidingBg: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 2,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  termBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  termText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  radialSummary: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  radialScore: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  radialLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  summaryMeta: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  summaryFootnote: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  subjectRow: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjName: {
    fontSize: 15,
    fontWeight: '700',
  },
  gradeTag: {
    fontSize: 13,
    fontWeight: '800',
  },
  subjectScores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  scoreVal: {
    fontSize: 13,
    fontWeight: '700',
  },
});
