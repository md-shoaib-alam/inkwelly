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
import { TeacherProfileView } from '@/modules/people/components/adminTeachers/profile/index';
import type { Teacher } from '@/modules/people/components/adminTeachers/types';

// In-memory cache for teacher details (5 minutes TTL)
const teacherDetailCache = new Map<string, { data: Teacher; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export default function TeacherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const cachedEntry = id ? teacherDetailCache.get(id) : null;
  const isCacheFresh = !!cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS;

  const [teacher, setTeacher] = useState<Teacher | null>(() => {
    return isCacheFresh && cachedEntry ? cachedEntry.data : null;
  });
  const [isLoading, setIsLoading] = useState(() => !isCacheFresh);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacher = useCallback(async (forceRefresh: boolean = false) => {
    if (!id) return;

    const entry = teacherDetailCache.get(id);
    const isFresh = entry && Date.now() - entry.timestamp < CACHE_TTL_MS;

    if (!forceRefresh && isFresh) {
      setTeacher(entry.data);
      setIsLoading(false);
      return;
    }

    try {
      if (!entry) {
        setIsLoading(true);
      }
      setError(null);
      const res: any = await api.get('/teachers', { params: { page: 1, limit: 50 } });
      const items: Teacher[] = res?.items || (Array.isArray(res) ? res : []);
      const found = items.find((t) => t.id === id);
      if (found) {
        teacherDetailCache.set(id, { data: found, timestamp: Date.now() });
        setTeacher(found);
      } else {
        // Fallback search by id
        const searchRes: any = await api.get('/teachers', { params: { search: id, limit: 20 } });
        const searchItems: Teacher[] = searchRes?.items || (Array.isArray(searchRes) ? searchRes : []);
        const match = searchItems.find((t) => t.id === id);
        if (match) {
          teacherDetailCache.set(id, { data: match, timestamp: Date.now() });
          setTeacher(match);
        } else {
          setError('Teacher not found.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load teacher.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  const handleDelete = async (t: Teacher) => {
    Alert.alert(
      'Delete Teacher Record',
      `Are you sure you want to permanently delete "${t.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/teachers?id=${t.id}`);
              teacherDetailCache.delete(t.id);
              adminCache.invalidate('teachers', t.id);
              router.back();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete teacher.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <DetailLoadingScreen
        title="Loading Teacher Profile..."
        subtitle="Retrieving faculty information and class assignments"
      />
    );
  }

  if (error || !teacher) {
    return (
      <ThemedView style={styles.center} safeAreaTop>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {error || 'Teacher not found.'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safeAreaTop>
      <TeacherProfileView
        teacher={teacher}
        onBack={() => router.back()}
        canEdit={isAdmin}
        canDelete={isAdmin}
        onEdit={() => router.back()}
        onDelete={handleDelete}
        onRefresh={fetchTeacher}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
