import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-context';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { adminCache } from '@/lib/adminCache';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { DetailLoadingScreen } from '@/components/common/DetailLoadingScreen';
import { ParentProfileView } from '@/components/admin/parents/profile';
import type { Parent, Child } from '@/components/admin/parents/types';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// In-memory cache for parent details (5 minutes TTL)
const parentDetailCache = new Map<string, { data: Parent; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export default function ParentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const cachedEntry = id ? parentDetailCache.get(id) : null;
  const isCacheFresh = !!cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS;

  const [parent, setParent] = useState<Parent | null>(() => {
    return isCacheFresh && cachedEntry ? cachedEntry.data : null;
  });
  const [isLoading, setIsLoading] = useState(() => !isCacheFresh);
  const [error, setError] = useState<string | null>(null);

  const fetchParent = useCallback(async (forceRefresh: boolean = false) => {
    if (!id) return;

    const entry = parentDetailCache.get(id);
    const isFresh = entry && Date.now() - entry.timestamp < CACHE_TTL_MS;

    if (!forceRefresh && isFresh) {
      setParent(entry.data);
      setIsLoading(false);
      return;
    }

    try {
      if (!entry) {
        setIsLoading(true);
      }
      setError(null);
      // Try direct fetch by ID first
      try {
        const directRes: any = await api.get(`/parents/${id}`);
        if (directRes && (directRes.id || directRes.name)) {
          parentDetailCache.set(id, { data: directRes, timestamp: Date.now() });
          setParent(directRes);
          return;
        }
      } catch {
        // Fall back to listing search
      }

      // Fallback: fetch from /parents list
      const res: any = await api.get('/parents', { params: { limit: 100 } });
      const items: Parent[] = res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
      const found = items.find((p) => p.id === id || p.userId === id);
      if (found) {
        parentDetailCache.set(id, { data: found, timestamp: Date.now() });
        setParent(found);
      } else {
        setError('Parent not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load parent.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchParent();
  }, [fetchParent]);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!parent) return;
    try {
      setIsDeleting(true);
      await api.delete(`/parents?id=${parent.id}`);
      parentDetailCache.delete(parent.id);
      adminCache.invalidate('parents', parent.id);
      setDeleteConfirmVisible(false);
      router.back();
    } catch (err: any) {
      Alert.alert('Delete Failed', err?.message || 'Could not delete parent.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Link Child picker state
  const [linkPickerVisible, setLinkPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerStudents, setPickerStudents] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!linkPickerVisible) return;
    let cancelled = false;
    setPickerLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res: any = await api.get('/students', {
          params: {
            mode: 'min',
            unlinkedOnly: 'true',
            search: pickerSearch.trim() || undefined,
            limit: 20,
          },
        });
        if (!cancelled) setPickerStudents(res?.items || []);
      } catch {
        if (!cancelled) setPickerStudents([]);
      } finally {
        if (!cancelled) setPickerLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [linkPickerVisible, pickerSearch]);

  const openLinkPicker = useCallback(() => {
    setPickerSearch('');
    setPickerStudents([]);
    setLinkPickerVisible(true);
  }, []);

  const handleLinkChild = useCallback(async (studentId: string) => {
    if (!parent || !studentId) return;
    try {
      setLinkingId(studentId);
      await api.post('/parents', { action: 'link', parentId: parent.id, studentId });
      setLinkPickerVisible(false);
      parentDetailCache.delete(parent.id);
      adminCache.invalidate('parents', parent.id);
      fetchParent(true);
      Alert.alert('Success', 'Student linked successfully!');
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Could not link student.');
    } finally {
      setLinkingId(null);
    }
  }, [parent, fetchParent]);

  const handleUnlinkChild = useCallback(async (child: Child) => {
    if (!parent) return;
    Alert.alert(
      'Unlink Child',
      `Unlink "${child.name}" from this parent?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/parents', { action: 'unlink', parentId: parent.id, studentId: child.id });
              fetchParent();
              Alert.alert('Success', `"${child.name}" unlinked.`);
            } catch (err: any) {
              Alert.alert('Failed', err?.message || 'Could not unlink child.');
            }
          },
        },
      ]
    );
  }, [parent, fetchParent]);

  if (isLoading) {
    return (
      <DetailLoadingScreen
        title="Loading Parent Profile..."
        subtitle="Retrieving parent information and linked children"
      />
    );
  }

  if (error || !parent) {
    return (
      <ThemedView style={styles.center} safeAreaTop>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
          {error || 'Parent not found.'}
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: '#059669' }]}
        >
          <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safeAreaTop>
      <ParentProfileView
        parent={parent}
        onBack={() => router.back()}
        canEdit={isAdmin}
        canDelete={isAdmin}
        onEdit={() => {
          router.back();
        }}
        onDelete={handleDelete}
        onLinkChildClick={openLinkPicker}
        onUnlinkChildClick={handleUnlinkChild}
        onRefresh={fetchParent}
      />

      {/* Modern Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => !isDeleting && setDeleteConfirmVisible(false)}
          style={{ 
            backgroundColor: colors.backgroundElement,
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 4 }}>
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Ionicons name="trash-outline" size={26} color="#DC2626" />
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
              Delete Parent Account
            </ThemedText>
          </View>
          <Dialog.Content style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
              Are you sure you want to permanently delete parent <ThemedText style={{ fontWeight: '700', color: colors.text }}>"{parent?.name}"</ThemedText>?
            </ThemedText>
            <View style={{
              backgroundColor: activeTheme === 'dark' ? '#1F2937' : '#F9FAFB',
              borderRadius: 12,
              padding: 12,
              marginTop: 14,
              borderWidth: 1,
              borderColor: activeTheme === 'dark' ? '#374151' : '#E5E7EB',
            }}>
              <ThemedText style={{ fontSize: 12, color: '#DC2626', fontWeight: '600', lineHeight: 16 }}>
                • All linked children will be immediately unlinked.
              </ThemedText>
              <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 16 }}>
                • Login credentials for this parent will be permanently disabled.
              </ThemedText>
            </View>
          </Dialog.Content>
          <Dialog.Actions style={{ gap: 10, paddingBottom: 20, paddingHorizontal: 20, paddingTop: 4 }}>
            <Button 
              mode="outlined" 
              textColor={colors.text} 
              disabled={isDeleting}
              style={{ flex: 1, borderRadius: 12, borderColor: colors.backgroundSelected, borderWidth: 1, height: 42, justifyContent: 'center' }} 
              labelStyle={{ fontWeight: '600', fontSize: 13 }}
              onPress={() => setDeleteConfirmVisible(false)}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor="#DC2626"
              textColor="#FFFFFF"
              loading={isDeleting}
              disabled={isDeleting}
              style={{ flex: 1.2, borderRadius: 12, height: 42, justifyContent: 'center' }}
              labelStyle={{ fontWeight: '700', fontSize: 13 }}
              onPress={confirmDelete}
            >
              Delete Account
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Link Child — Student Picker Dialog */}
      <Portal>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none">
        <Dialog
          visible={linkPickerVisible}
          onDismiss={() => linkingId === null && setLinkPickerVisible(false)}
          style={{
            backgroundColor: colors.backgroundElement,
            borderRadius: 20,
            marginHorizontal: 24,
            maxHeight: '75%',
          }}
        >
          <Dialog.Title style={{ margin: 0, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 }}>
            <ThemedText style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              Link Child
            </ThemedText>
          </Dialog.Title>
          <Dialog.Content style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
            <ThemedText style={{ fontSize: 12.5, color: colors.textSecondary, marginBottom: 10 }}>
              Search for an unlinked student to add to {parent?.name}.
            </ThemedText>
            <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
              <Ionicons name="search-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Name, roll number or School ID..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
              {pickerSearch.length > 0 && (
                <TouchableOpacity onPress={() => setPickerSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 300, marginTop: 10 }} keyboardShouldPersistTaps="handled">
              {pickerLoading ? (
                <View style={styles.pickerCenter}>
                  <ActivityIndicator size="small" color="#059669" />
                </View>
              ) : pickerStudents.length === 0 ? (
                <View style={styles.pickerCenter}>
                  <ThemedText style={{ fontSize: 13, color: colors.textSecondary }}>
                    {pickerSearch.trim() ? 'No matching unlinked students found.' : 'No unlinked students found.'}
                  </ThemedText>
                </View>
              ) : (
                pickerStudents.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.studentRow, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}
                    onPress={() => handleLinkChild(s.id)}
                    disabled={linkingId !== null}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.studentAvatar, { backgroundColor: '#ECFDF5' }]}>
                      <Ionicons name="person-outline" size={16} color="#059669" />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <ThemedText style={{ fontSize: 13.5, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                        {s.name}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 11.5, color: colors.textSecondary }} numberOfLines={1}>
                        {[s.className, s.rollNumber && `Roll: ${s.rollNumber}`].filter(Boolean).join('  •  ') || 'No class assigned'}
                      </ThemedText>
                    </View>
                    {linkingId === s.id ? (
                      <ActivityIndicator size="small" color="#059669" />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 18, paddingTop: 4 }}>
            <Button
              mode="outlined"
              textColor={colors.text}
              disabled={linkingId !== null}
              style={{ borderRadius: 12, borderColor: colors.backgroundSelected, borderWidth: 1, height: 42, justifyContent: 'center' }}
              labelStyle={{ fontWeight: '600', fontSize: 13 }}
              onPress={() => setLinkPickerVisible(false)}
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
        </KeyboardAvoidingView>
      </Portal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  pickerCenter: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  studentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
