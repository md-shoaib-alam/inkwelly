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
import { StaffProfileView } from '@/components/admin/staff/profile';
import type { StaffMember, CustomRole } from '@/components/admin/staff/types';

// In-memory cache for staff details (5 minutes TTL)
const staffDetailCache = new Map<string, { member: StaffMember; roles: CustomRole[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const cachedEntry = id ? staffDetailCache.get(id) : null;
  const isCacheFresh = !!cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS;

  const [member, setMember] = useState<StaffMember | null>(() => {
    return isCacheFresh && cachedEntry ? cachedEntry.member : null;
  });
  const [roles, setRoles] = useState<CustomRole[]>(() => {
    return isCacheFresh && cachedEntry ? cachedEntry.roles : [];
  });
  const [isLoading, setIsLoading] = useState(() => !isCacheFresh);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async (forceRefresh: boolean = false) => {
    if (!id) return;

    const entry = staffDetailCache.get(id);
    const isFresh = entry && Date.now() - entry.timestamp < CACHE_TTL_MS;

    if (!forceRefresh && isFresh) {
      setMember(entry.member);
      setRoles(entry.roles);
      setIsLoading(false);
      return;
    }

    try {
      if (!entry) {
        setIsLoading(true);
      }
      setError(null);
      const [resStaff, resRoles] = await Promise.all([
        api.get<any>('/staff'),
        api.get<any>('/roles'),
      ]);
      const staffList: StaffMember[] = Array.isArray(resStaff)
        ? resStaff
        : resStaff?.items || [];
      const found = staffList.find((s) => s.id === id);
      const currentRoles = Array.isArray(resRoles) ? resRoles : [];
      if (found) {
        staffDetailCache.set(id, { member: found, roles: currentRoles, timestamp: Date.now() });
        setMember(found);
      } else {
        setError('Staff member not found.');
      }
      if (Array.isArray(resRoles)) setRoles(currentRoles);
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff member.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const handleDelete = async (m: StaffMember) => {
    Alert.alert(
      'Delete Staff Record',
      `Are you sure you want to permanently delete "${m.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/staff?id=${m.id}`);
              staffDetailCache.delete(m.id);
              adminCache.invalidate('staff', m.id);
              router.back();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete staff member.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <DetailLoadingScreen
        title="Loading Staff Profile..."
        subtitle="Retrieving staff details and assigned role permissions"
      />
    );
  }

  if (error || !member) {
    return (
      <ThemedView style={styles.center} safeAreaTop>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {error || 'Staff member not found.'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safeAreaTop>
      <StaffProfileView
        member={member}
        roles={roles}
        onBack={() => router.back()}
        canEdit={isAdmin}
        canDelete={isAdmin}
        onEdit={() => router.back()}
        onDelete={handleDelete}
        onRefresh={fetchMember}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
