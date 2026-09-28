import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-context';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { adminCache } from '@/lib/adminCache';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { DetailLoadingScreen } from '@/components/common/DetailLoadingScreen';
import { StudentProfileView } from '@/modules/people/components/students/profile/index';
import type { Student } from '@/types/index';

// In-memory cache for student details (5 minutes TTL)
const studentDetailCache = new Map<string, { data: Student; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const cachedEntry = id ? studentDetailCache.get(id) : null;
  const isCacheFresh = !!cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS;

  const [student, setStudent] = useState<Student | null>(() => {
    return isCacheFresh && cachedEntry ? cachedEntry.data : null;
  });
  const [isLoading, setIsLoading] = useState(() => !isCacheFresh);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = useCallback(async (forceRefresh: boolean = false) => {
    if (!id) return;

    const entry = studentDetailCache.get(id);
    const isFresh = entry && Date.now() - entry.timestamp < CACHE_TTL_MS;

    if (!forceRefresh && isFresh) {
      setStudent(entry.data);
      setIsLoading(false);
      return;
    }

    try {
      if (!entry) {
        setIsLoading(true);
      }
      setError(null);
      const res: any = await api.get('/students', { params: { search: id, limit: 20 } });
      const items: Student[] = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      const found = items.find((s) => s.id === id);
      if (found) {
        studentDetailCache.set(id, { data: found, timestamp: Date.now() });
        setStudent(found);
      } else {
        // Fallback: try direct fetch by id
        const direct: any = await api.get(`/students/${id}`);
        if (direct?.id) {
          studentDetailCache.set(id, { data: direct, timestamp: Date.now() });
          setStudent(direct);
        } else {
          setError('Student not found.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load student.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleToggleStatus = async (s: Student) => {
    try {
      const newStatus = s.status === 'active' ? 'inactive' : 'active';
      await api.put('/students', { id: s.id, status: newStatus });
      studentDetailCache.delete(s.id);
      adminCache.invalidate('students', s.id);
      fetchStudent(true);
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Could not update status.');
    }
  };

  if (isLoading) {
    return (
      <DetailLoadingScreen
        title="Loading Student Profile..."
        subtitle="Retrieving student details and academic records"
      />
    );
  }

  if (error || !student) {
    return (
      <ThemedView style={styles.center} safeAreaTop>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {error || 'Student not found.'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safeAreaTop>
      <StudentProfileView
        student={student}
        onBack={() => router.back()}
        canEdit={isAdmin}
        canDelete={isAdmin}
        onEdit={() => router.back()}
        onToggleStatus={handleToggleStatus}
        onStudentUpdated={(updated) => setStudent(updated)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
