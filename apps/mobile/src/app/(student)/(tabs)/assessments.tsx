import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

export default function StudentAssessmentsScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);

  const fetchStudentContext = useCallback(async () => {
    try {
      const studentMe = await api.get('/students/me');
      setProfile(studentMe);

      if (studentMe && studentMe.id) {
        // Fetch assessments
        const [assessRes, classAssessRes] = await Promise.all([
          api.get(`/assessments/student-grades`, { params: { studentId: studentMe.id } }).catch(() => []),
          api.get(`/assessments`, { params: { classId: studentMe.classId } }).catch(() => [])
        ]);

        const graded = Array.isArray(assessRes) ? assessRes : [];
        const classAssessments = Array.isArray(classAssessRes) ? classAssessRes : [];
        const gradedMap = new Map(graded.map(g => [g.assessmentId, g]));

        const combined: any[] = [...graded];
        classAssessments.forEach(a => {
          if (!gradedMap.has(a.id)) {
            combined.push({
              id: `pending_${a.id}`,
              assessmentId: a.id,
              title: a.title,
              type: a.type,
              subjectName: a.subject?.name || 'N/A',
              marksObtained: null,
              totalMarks: a.totalMarks,
              passingMarks: a.passingMarks,
              remarks: 'Pending Grading',
              createdAt: a.createdAt
            });
          }
        });
        setAssessments(combined);
      }
    } catch (err) {
      console.error('Failed to fetch student context:', err);
    }
  }, []);

  // Load everything
  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchStudentContext();
      setLoading(false);
    }
    init();
  }, [fetchStudentContext]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudentContext();
    setRefreshing(false);
  };

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
          {assessments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={48} color={colors.textSecondary} />
              <ThemedText style={{ marginTop: 12, color: colors.textSecondary }}>No continuous assessments found.</ThemedText>
            </View>
          ) : (
            assessments.map((a, index) => {
              const graded = a.marksObtained !== null;
              const pct = graded ? Math.round((a.marksObtained / a.totalMarks) * 100) : 0;
              const passed = graded && a.marksObtained >= a.passingMarks;

              return (
                <View key={index} style={[styles.assessCard, { backgroundColor: colors.backgroundElement }]}>
                  <View style={styles.assessHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.assessTitle}>{a.title || 'Assignment/Quiz'}</ThemedText>
                      <ThemedText style={[styles.assessSub, { color: colors.textSecondary }]}>{a.subjectName} · {a.type?.toUpperCase() || 'ASSESSMENT'}</ThemedText>
                    </View>
                    {graded ? (
                      <View style={[styles.statusBadge, passed ? { backgroundColor: 'rgba(52,199,89,0.12)' } : { backgroundColor: 'rgba(255,59,48,0.12)' }]}>
                        <ThemedText style={passed ? { color: '#34C759', fontSize: 12, fontWeight: '700' } : { color: '#FF3B30', fontSize: 12, fontWeight: '700' }}>
                          {pct}%
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,149,0,0.12)' }]}>
                        <ThemedText style={{ color: '#FF9500', fontSize: 12, fontWeight: '700' }}>Grading</ThemedText>
                      </View>
                    )}
                  </View>

                  <View style={[styles.assessScores, { borderTopColor: colors.backgroundSelected }]}>
                    <View style={styles.assessScoreItem}>
                      <ThemedText style={[styles.assessScoreLbl, { color: colors.textSecondary }]}>Marks Obtained</ThemedText>
                      <ThemedText style={styles.assessScoreVal}>{graded ? `${a.marksObtained}/${a.totalMarks}` : 'Pending'}</ThemedText>
                    </View>
                    <View style={styles.assessScoreItem}>
                      <ThemedText style={[styles.assessScoreLbl, { color: colors.textSecondary }]}>Passing Marks</ThemedText>
                      <ThemedText style={styles.assessScoreVal}>{a.passingMarks}</ThemedText>
                    </View>
                  </View>
                  {a.remarks ? (
                    <ThemedText style={[styles.assessRemarks, { color: colors.textSecondary }]}>
                      Feedback: {a.remarks}
                    </ThemedText>
                  ) : null}
                </View>
              );
            })
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
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  assessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assessTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  assessSub: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  assessScores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  assessScoreItem: {
    flex: 1,
  },
  assessScoreLbl: {
    fontSize: 11,
    marginBottom: 2,
  },
  assessScoreVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  assessRemarks: {
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
});
