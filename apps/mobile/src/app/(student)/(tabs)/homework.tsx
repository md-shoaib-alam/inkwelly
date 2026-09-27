import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useRouter } from 'expo-router';
import type { StudentProfile, HomeworkItem, SubmissionItem } from '@/types';

export default function StudentHomeworkScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [activeSegment, setActiveSegment] = useState<'pending' | 'submitted'>('pending');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const studentMe = await api.get<any>('/students/me');
      setProfile(studentMe);

      if (studentMe && studentMe.id) {
        const [hwRes, subRes] = await Promise.all([
          api.get<any>('/homework', { params: { classId: studentMe.classId } }),
          api.get<any>('/submissions', { params: { studentId: studentMe.id } }).catch(() => ({ data: [] }))
        ]);
        setHomeworks(Array.isArray(hwRes) ? hwRes : []);
        setSubmissions(Array.isArray(subRes.data) ? subRes.data : Array.isArray(subRes) ? subRes : []);
      }
    } catch (error) {
      console.error('Failed to load homework assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Check which homework has been submitted
  const enrichedHomeworks = useMemo(() => {
    const subSet = new Set(submissions.map((s: any) => s.assignmentId));
    const now = new Date();

    const parseDateSafely = (dateVal: any) => {
      if (!dateVal) return new Date();
      try {
        const dStr = typeof dateVal === 'string' ? dateVal : String(dateVal);
        const formattedStr = dStr.trim().replace(' ', 'T');
        const parsed = new Date(formattedStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
        const parts = dStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (parts) {
          return new Date(parseInt(parts[1], 10), parseInt(parts[2], 10) - 1, parseInt(parts[3], 10));
        }
        return new Date(dStr);
      } catch (e) {
        return new Date();
      }
    };

    const formatDateSafely = (dateVal: any) => {
      if (!dateVal) return 'N/A';
      try {
        const dStr = typeof dateVal === 'string' ? dateVal : String(dateVal);
        const datePart = dStr.split('T')[0].split(' ')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const monthNum = parseInt(parts[1], 10);
          const day = parts[2];
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = months[monthNum - 1] || 'Jan';
          return `${monthName} ${parseInt(day, 10)}, ${year}`;
        }
        return datePart;
      } catch (e) {
        return String(dateVal);
      }
    };

    return homeworks.map(hw => {
      const isSubmitted = subSet.has(hw.id);
      const due = parseDateSafely(hw.dueDate);
      const isOverdue = !isSubmitted && due < now;
      
      let status: 'submitted' | 'overdue' | 'pending' = 'pending';
      if (isSubmitted) status = 'submitted';
      else if (isOverdue) status = 'overdue';

      return {
        ...hw,
        status,
        formattedDueDate: formatDateSafely(hw.dueDate)
      };
    });
  }, [homeworks, submissions]);

  const displayedHomework = useMemo(() => {
    if (activeSegment === 'pending') {
      return enrichedHomeworks.filter(h => h.status === 'pending' || h.status === 'overdue');
    }
    return enrichedHomeworks.filter(h => h.status === 'submitted');
  }, [enrichedHomeworks, activeSegment]);

  const handleOnlineSubmit = async (homework: any) => {
    if (!profile) return;
    setSubmittingId(homework.id);
    try {
      const payload = {
        assignmentId: homework.id,
        studentId: profile.id,
        status: 'submitted'
      };
      await api.post('/submissions', payload);
      Alert.alert('Success', `"${homework.title}" submitted successfully!`);
      // Reload submissions
      const subRes = await api.get<any>('/submissions', { params: { studentId: profile.id } });
      setSubmissions(Array.isArray(subRes.data) ? subRes.data : Array.isArray(subRes) ? subRes : []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit homework.');
    } finally {
      setSubmittingId(null);
    }
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
      {/* Segment controls */}
      <View style={styles.segmentWrapper}>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeSegment === 'pending' && { backgroundColor: '#007AFF' }]} 
          onPress={() => setActiveSegment('pending')}
        >
          <ThemedText style={[styles.segmentText, activeSegment === 'pending' && { color: '#FFF' }]}>Pending</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeSegment === 'submitted' && { backgroundColor: '#007AFF' }]} 
          onPress={() => setActiveSegment('submitted')}
        >
          <ThemedText style={[styles.segmentText, activeSegment === 'submitted' && { color: '#FFF' }]}>Submitted</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
        }
      >
        {displayedHomework.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <ThemedText style={{ marginTop: 12, color: colors.textSecondary }}>No homework found.</ThemedText>
          </View>
        ) : (
          displayedHomework.map((hw) => {
            const isOverdue = hw.status === 'overdue';
            const isSubmitted = hw.status === 'submitted';
            
            return (
              <View key={hw.id} style={[styles.hwCard, { backgroundColor: colors.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrapper}>
                    <ThemedText style={styles.hwTitle}>{hw.title}</ThemedText>
                    <ThemedText style={[styles.subjectTag, { backgroundColor: colors.backgroundSelected, color: '#007AFF' }]}>
                      {hw.subjectName}
                    </ThemedText>
                  </View>
                  {isSubmitted ? (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
                      <ThemedText style={{ color: '#34C759', fontSize: 11, fontWeight: '700' }}>Submitted</ThemedText>
                    </View>
                  ) : isOverdue ? (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 59, 48, 0.12)' }]}>
                      <ThemedText style={{ color: '#FF3B30', fontSize: 11, fontWeight: '700' }}>Overdue</ThemedText>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 149, 0, 0.12)' }]}>
                      <ThemedText style={{ color: '#FF9500', fontSize: 11, fontWeight: '700' }}>Pending</ThemedText>
                    </View>
                  )}
                </View>

                <ThemedText style={[styles.hwContent, { color: colors.text }]}>{hw.content}</ThemedText>
                
                <View style={[styles.metaRow, { borderTopColor: colors.backgroundSelected }]}>
                  <View style={styles.metaCol}>
                    <ThemedText style={[styles.metaLabel, { color: colors.textSecondary }]}>Teacher</ThemedText>
                    <ThemedText style={styles.metaVal}>{hw.teacherName || 'Standard'}</ThemedText>
                  </View>
                  <View style={styles.metaCol}>
                    <ThemedText style={[styles.metaLabel, { color: colors.textSecondary }]}>Due Date</ThemedText>
                    <ThemedText style={[styles.metaVal, isOverdue && { color: '#FF3B30', fontWeight: 'bold' }]}>
                      {hw.formattedDueDate}
                    </ThemedText>
                  </View>
                </View>

                {hw.mode === 'online' && !isSubmitted && (
                  <TouchableOpacity 
                    style={[styles.submitButton, isOverdue ? { backgroundColor: '#FF3B30' } : { backgroundColor: '#007AFF' }]}
                    onPress={() => handleOnlineSubmit(hw)}
                    disabled={submittingId === hw.id}
                  >
                    {submittingId === hw.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <ThemedText style={styles.submitBtnText}>Submit Online Assignment</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentWrapper: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    padding: 2,
    borderRadius: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hwCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 8,
  },
  hwTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hwContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
