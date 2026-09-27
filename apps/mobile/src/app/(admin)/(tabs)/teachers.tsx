import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, useWindowDimensions, FlatList } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { adminCache } from '@/lib/adminCache';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

// Subcomponents
import { Teacher } from '@/components/admin/teachers/types';
import { TeacherCard } from '@/components/admin/teachers/TeacherCard';
import { AddTeacherScreen } from '@/components/admin/teachers/AddTeacherScreen';

export default function TeachersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();

  const numColumns = width >= 1024 ? 3 : width >= 650 ? 2 : 1;
  const isTablet = numColumns > 1;

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Custom alert dialog states
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canCreate = isAdmin;

  const fetchTeachers = useCallback(async (pageNum: number, shouldAppend: boolean = false) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const res: any = await api.get('/teachers', {
        params: {
          page: pageNum,
          limit: 20,
          search: search || undefined,
        }
      });

      if (shouldAppend) {
        setTeachers(prev => [...prev, ...res.items]);
      } else {
        setTeachers(res.items);
      }
      setTotalPages(res.totalPages);
      setPage(pageNum);
      if (pageNum === 1 && !search) {
        adminCache.markFetched('teachers');
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [search]);

  // Subscribe to mutations (Add, Edit, Delete from other screens)
  useEffect(() => {
    const unsubscribe = adminCache.subscribe('teachers', () => {
      fetchTeachers(1);
    });
    return unsubscribe;
  }, [fetchTeachers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!search && adminCache.isFresh('teachers') && teachers.length > 0) {
        return;
      }
      fetchTeachers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTeachers, search]);

  useFocusEffect(
    useCallback(() => {
      // Re-fetch teachers on focus only if cache expired or list empty
      if (!adminCache.isFresh('teachers') || teachers.length === 0) {
        fetchTeachers(1);
      }
      return () => {
        setActiveMenuId(null);
      };
    }, [fetchTeachers, teachers.length])
  );

  const handleRefresh = () => {
    setActiveMenuId(null);
    setIsRefreshing(true);
    adminCache.invalidate('teachers');
    fetchTeachers(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchTeachers(page + 1, true);
    }
  };

  const handleOpenCreate = () => {
    router.push({ pathname: '/(admin)/teachers/new' });
  };

  const handleOpenEdit = (teacher: Teacher) => {
    const teacherSubjects = Array.isArray(teacher.subjects) && teacher.subjects.length > 0 ? teacher.subjects[0] : 'Mathematics';
    router.push({
      pathname: '/(admin)/teachers/new',
      params: {
        mode: 'edit',
        id: teacher.id,
        name: teacher.name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        alternatePhone: (teacher as any).alternatePhone || '',
        address: (teacher as any).address || '',
        gender: (teacher as any).gender || 'male',
        dateOfBirth: (teacher as any).dateOfBirth || '',
        teacherId: (teacher as any).teacherId || '',
        qualification: teacher.qualification || 'B.Ed',
        experience: teacher.experience || '',
        role: (teacher as any).role || 'Faculty Member',
        subjects: teacherSubjects,
        joiningDate: teacher.joiningDate || '',
        status: (teacher as any).status || 'active',
      },
    });
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setDeleteConfirmVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/teachers?id=${id}`);
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to delete teacher record.');
      setErrorVisible(true);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomWidth: 0 }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search teachers by name or email..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }]}
          />
        </View>
      </View>

      {/* Teachers List / Grid */}
      {isLoading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF9500" />
        </View>
      ) : (
        <FlatList
          key={`teachers-grid-${numColumns}`}
          data={teachers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ flex: 1 / numColumns, marginHorizontal: numColumns > 1 ? 6 : 0 }}>
              <TeacherCard
                item={item}
                colors={colors}
                activeTheme={activeTheme}
                isTablet={isTablet}
                isAdmin={isAdmin}
                onPress={() => {
                  router.push({ pathname: '/(admin)/teachers/[id]', params: { id: item.id } });
                }}
                onEdit={() => handleOpenEdit(item)}
                onDelete={() => handleDeleteClick(item)}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.tabletGridWrapper : undefined}

          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{ padding: 16 }} color="#FF9500" /> : <View style={{ height: 20 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#E5E5E5" />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No teachers found.</ThemedText>
            </View>
          }
        />
      )}

      {canCreate && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: '#FF9500' }]}
          onPress={handleOpenCreate}
          color="#FFF"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Delete Teacher?</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>
              Are you sure you want to delete "{teacherToDelete?.name}"?
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setDeleteConfirmVisible(false)}>Cancel</Button>
            <Button
              buttonColor="#FF3B30"
              textColor="#FFFFFF"
              onPress={async () => {
                if (teacherToDelete) {
                  await handleDelete(teacherToDelete.id);
                  setDeleteConfirmVisible(false);
                }
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Error Dialog */}
        <Dialog
          visible={errorVisible}
          onDismiss={() => setErrorVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: '#FF3B30' }}>Error</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>
              {errorMsg}
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setErrorVisible(false)}>OK</Button>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 12,
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  tabletGridWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});
