import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';

// Sub-components
import { ChildSelector } from '@/components/parent/ChildSelector';
import { GradesSummary } from '@/components/parent/grades/GradesSummary';
import { GradesList } from '@/components/parent/grades/GradesList';
import { Skeleton } from '@/components/Skeleton';

export default function ParentGradesScreen() {
  const { user } = useAuth();
  const { activeTheme, selectedChildId, setSelectedChildId } = useSettings();
  const colors = Colors[activeTheme];

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [children, setChildren] = useState<any[]>([]);

  const fetchGradesData = async (silent = false) => {
    if (!user?.name) return;
    if (!silent) setIsLoading(true);
    try {
      const parentQuery = `
        query ParentDashboard($parentName: String!) {
          parentDashboard(parentName: $parentName) {
            children { 
              id name className rollNumber classId
              grades { id studentId studentName subjectName examType marks maxMarks grade createdAt }
            }
            performanceSummary { name attendanceRate avgGrade grade }
          }
        }
      `;
      const gqlRes: any = await api.post('/graphql', { query: parentQuery, variables: { parentName: user.name } });
      if (gqlRes.errors && gqlRes.errors.length > 0) {
        throw new Error(gqlRes.errors[0].message);
      }
      const data = gqlRes.data?.parentDashboard || {};
      const childList = data.children || [];
      setChildren(childList);
      if (childList.length > 0 && !selectedChildId) {
        setSelectedChildId(childList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch grades dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchGradesData();
    }
  }, [user?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    await fetchGradesData(true);
    setIsRefreshing(false);
  };

  const activeChild = children.find(c => c.id === selectedChildId) || children[0];
  const activeGrades = activeChild?.grades || [];

  // Compute stats
  const formattedGrades = useMemo(() => {
    return activeGrades.map((g: any) => ({
      subject: g.subjectName,
      grade: g.grade || 'N/A',
      marks: `${g.marks}/${g.maxMarks}`,
      remarks: `Exam: ${g.examType || 'Term Exam'}. Date: ${g.createdAt ? g.createdAt.slice(0, 10) : 'N/A'}`
    }));
  }, [activeGrades]);

  // Calculate GPA / Average Grade
  const averageGrade = useMemo(() => {
    if (activeGrades.length === 0) return 'N/A';
    const sum = activeGrades.reduce((s: number, g: any) => s + (g.marks / g.maxMarks) * 100, 0);
    const avg = Math.round(sum / activeGrades.length);
    return `${avg}%`;
  }, [activeGrades]);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#FF2D55']} />}
        >
          {/* ChildSelector Skeleton */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <Skeleton width={80} height={32} borderRadius={16} />
            <Skeleton width={100} height={32} borderRadius={16} />
            <Skeleton width={90} height={32} borderRadius={16} />
          </View>

          {/* GradesSummary Skeleton */}
          <View style={{ height: 100, borderRadius: 20, padding: 16, backgroundColor: colors.backgroundElement, gap: 12, marginBottom: 20, justifyContent: 'center' }}>
            <Skeleton width="30%" height={14} />
            <Skeleton width="60%" height={24} />
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
              <Skeleton width="40%" height={10} />
              <Skeleton width="40%" height={10} />
            </View>
          </View>

          {/* GradesList Skeletons (Matching real card style and spacing) */}
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ padding: 16, borderRadius: 20, marginBottom: 12, backgroundColor: colors.backgroundElement }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Skeleton width="40%" height={16} />
                    <Skeleton width="20%" height={12} />
                  </View>
                  <Skeleton width={44} height={44} borderRadius={12} />
                </View>
                <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 }} />
                <Skeleton width="75%" height={12} />
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (!isLoading && children.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#FF2D55']} />}
        >
          <View style={{ alignItems: 'center', padding: 24, gap: 16 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.backgroundSelected, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: colors.text }}>No Wards Linked</ThemedText>
            <ThemedText style={{ fontSize: 14, textAlign: 'center', color: colors.textSecondary, lineHeight: 20 }}>
              There are no student profiles currently linked to this parent account. Please contact the school administration to link your children.
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#FF2D55']} />}
      >
        {children.length > 0 && (
          <ChildSelector 
            students={children} 
            selectedStudentId={selectedChildId} 
            onSelect={setSelectedChildId} 
          />
        )}

        <GradesSummary 
          gpa={averageGrade}
          rank="N/A"
          attendance={activeChild?.attendancePct || '96%'}
        />

        <GradesList 
          grades={formattedGrades}
        />

        <View style={[styles.infoCard, { backgroundColor: colors.backgroundElement }]}>
          <ThemedText style={styles.infoTitle}>Final Term Results</ThemedText>
          <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
            Official signed report cards will be available for pickup from the school office on July 5th, 2026.
          </ThemedText>
          <TouchableOpacity style={styles.downloadButton}>
            <Ionicons name="cloud-download-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <ThemedText style={styles.downloadButtonText}>Download Digital Copy</ThemedText>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#FF2D55',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
