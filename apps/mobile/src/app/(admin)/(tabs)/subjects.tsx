import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert, TouchableOpacity, useWindowDimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

// Sub-components
import { SubjectFilters } from '@/modules/academics/components/adminSubjects/SubjectFilters';
import { SubjectCard, SubjectInfo } from '@/modules/academics/components/adminSubjects/SubjectList';
import { SubjectDialogs } from '@/modules/academics/components/adminSubjects/SubjectDialogs';
import { SelectClassGrid } from '@/modules/academics/components/adminSubjects/SelectClassGrid';

interface ClassInfo {
  id: string;
  name: string;
  section: string;
}

interface TeacherInfo {
  id: string;
  name: string;
}

const emptyForm = { name: '', code: '', classId: '', teacherId: '' };

export default function SubjectsScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();
  const isTablet = width >= 650;

  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog and form states
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [creating, setCreating] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', ...emptyForm });
  const [updating, setUpdating] = useState(false);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Success / Error dialog states
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canCreate = isAdmin;

  // Paginated Fetch of Subjects
  const fetchSubjects = useCallback(async (pageNum: number, shouldAppend: boolean = false, isRefreshCall: boolean = false) => {
    // If no class is selected yet, we show the grid state instead
    if (!classFilter) {
      setSubjects([]);
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      if (pageNum === 1 && !isRefreshCall) setIsLoading(true);
      else if (pageNum > 1) setIsLoadingMore(true);

      const res = await api.get<any>('/subjects', {
        params: {
          page: pageNum,
          limit: 20,
          search: search || undefined,
          classId: classFilter === 'all' ? undefined : classFilter,
        }
      });

      const items = Array.isArray(res) ? res : res.items || [];
      const totalPagesNum = res.totalPages || 1;

      if (shouldAppend) {
        setSubjects((prev) => [...prev, ...items]);
      } else {
        setSubjects(items);
      }
      setTotalPages(totalPagesNum);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [search, classFilter]);

  // Fetch classes & teachers info (once on mount)
  useEffect(() => {
    async function fetchMetaData() {
      try {
        const classesRes = await api.get<any>('/classes?mode=min');
        const teachersRes = await api.get<any>('/teachers?mode=min');
        setClasses(Array.isArray(classesRes) ? classesRes : classesRes.items || []);
        setTeachers(Array.isArray(teachersRes) ? teachersRes : teachersRes.items || []);
      } catch (error) {
        console.error('Failed to fetch meta data:', error);
      }
    }
    fetchMetaData();
  }, []);

  // Set loading state immediately when class filter is selected to avoid showing "no subjects" during debounce delay
  useEffect(() => {
    if (classFilter) {
      setIsLoading(true);
      setSubjects([]);
    }
  }, [classFilter]);

  // Sync / Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects(1, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchSubjects]);

  // Pull-to-refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSubjects(1, false, true);
  };

  // Infinite scroll load-more trigger
  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore && !isLoading) {
      fetchSubjects(page + 1, true);
    }
  };

  // Handle create subject submission
  const handleCreate = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.classId) {
      setErrorMsg('Please fill in all required fields.');
      setErrorVisible(true);
      return;
    }

    try {
      setCreating(true);
      const newSub: any = await api.post('/subjects', {
        name: form.name.trim(),
        code: form.code.trim(),
        classId: form.classId,
        teacherId: form.teacherId || null,
      });
      setSuccessMsg('Subject created successfully.');
      setSuccessVisible(true);
      setCreateOpen(false);
      setForm({ ...emptyForm });
      if (newSub && newSub.id) {
        const matchesFilter = !classFilter || classFilter === 'all' || form.classId === classFilter;
        if (matchesFilter) {
          const selClass = classes.find((c: ClassInfo) => c.id === form.classId);
          const selTeacher = teachers.find((t: TeacherInfo) => t.id === form.teacherId);
          setSubjects(prev => [{
            ...newSub,
            className: selClass ? `${selClass.name}-${selClass.section}` : '',
            teacherName: selTeacher ? selTeacher.name : undefined,
          }, ...prev]);
        }
      } else {
        fetchSubjects(1, false);
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to create subject.');
      setErrorVisible(true);
    } finally {
      setCreating(false);
    }
  };

  // Open edit dialog with values populated
  const handleOpenEdit = (subject: SubjectInfo) => {
    setEditForm({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      classId: subject.classId,
      teacherId: subject.teacherId || '',
    });
    setEditOpen(true);
  };

  // Handle edit subject submission
  const handleEdit = async () => {
    if (!editForm.name.trim() || !editForm.code.trim() || !editForm.classId) {
      setErrorMsg('Please fill in all required fields.');
      setErrorVisible(true);
      return;
    }

    try {
      setUpdating(true);
      await api.put('/subjects', {
        id: editForm.id,
        name: editForm.name.trim(),
        code: editForm.code.trim(),
        classId: editForm.classId,
        teacherId: editForm.teacherId || null,
      });
      setSuccessMsg('Subject updated successfully.');
      setSuccessVisible(true);
      setEditOpen(false);

      const matchesFilter = !classFilter || classFilter === 'all' || editForm.classId === classFilter;
      const selClass = classes.find((c: ClassInfo) => c.id === editForm.classId);
      const selTeacher = teachers.find((t: TeacherInfo) => t.id === editForm.teacherId);

      setSubjects(prev => {
        if (!matchesFilter) {
          return prev.filter(s => s.id !== editForm.id);
        }
        return prev.map(s => s.id === editForm.id ? {
          ...s,
          name: editForm.name.trim(),
          code: editForm.code.trim(),
          classId: editForm.classId,
          teacherId: editForm.teacherId || undefined,
          className: selClass ? `${selClass.name}-${selClass.section}` : s.className,
          teacherName: selTeacher ? selTeacher.name : undefined,
        } : s);
      });
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to update subject.');
      setErrorVisible(true);
    } finally {
      setUpdating(false);
    }
  };

  // Click delete subject trigger
  const handleDeleteClick = (subject: SubjectInfo) => {
    setSubjectToDelete(subject);
    setDeleteConfirmVisible(true);
  };

  // Handle delete operation
  const handleDelete = async () => {
    if (!subjectToDelete) return;
    const targetId = subjectToDelete.id;
    try {
      setDeleting(true);
      await api.delete(`/subjects?id=${targetId}`);
      setSuccessMsg('Subject deleted successfully.');
      setSuccessVisible(true);
      setDeleteConfirmVisible(false);
      setSubjectToDelete(null);
      setSubjects(prev => prev.filter(s => s.id !== targetId));
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to delete subject.');
      setErrorVisible(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>


      {/* Persistent Filters Bar */}
      <View style={{ paddingTop: 16 }}>
        <SubjectFilters
          colors={colors}
          search={search}
          onSearchChange={setSearch}
          classFilter={classFilter}
          onClassFilterChange={setClassFilter}
          classes={classes}
        />
      </View>

      {/* Main Content Area */}
      {!classFilter ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListEmptyComponent={
            <SelectClassGrid
              colors={colors}
              classes={classes}
              onClassSelect={setClassFilter}
            />
          }
        />
      ) : isLoading && page === 1 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={{ marginTop: 10, color: colors.textSecondary }}>Loading subjects...</ThemedText>
        </View>
      ) : (
        <FlatList
          key={isTablet ? 'tablet-grid' : 'mobile-list'}
          data={subjects}
          keyExtractor={(item) => item.id}
          numColumns={isTablet ? 2 : 1}
          columnWrapperStyle={isTablet ? styles.tabletGridWrapper : undefined}
          renderItem={({ item }) => (
            <SubjectCard
              colors={colors}
              subject={item}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteClick}
              isTablet={isTablet}
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{ padding: 16 }} color="#007AFF" /> : <View style={{ height: 20 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color={colors.backgroundSelected} />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                No subjects found matching the criteria.
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Floating Action Button for creation */}
      {canCreate && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: '#007AFF' }]}
          color="#FFF"
          onPress={() => setCreateOpen(true)}
        />
      )}

      {/* Forms and modals logic */}
      <SubjectDialogs
        colors={colors}
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        form={form}
        setForm={setForm}
        classes={classes}
        teachers={teachers}
        onCreate={handleCreate}
        creating={creating}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        editForm={editForm}
        setEditForm={setEditForm}
        onEdit={handleEdit}
        updating={updating}
      />

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
        >
          <Dialog.Title style={{ color: colors.text }}>Delete Subject</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text }}>
              Are you sure you want to permanently delete subject{' '}
              <ThemedText style={{ fontWeight: 'bold' }}>{subjectToDelete?.name}</ThemedText> (
              {subjectToDelete?.code})? This cannot be undone.
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setDeleteConfirmVisible(false)}>
              Cancel
            </Button>
            <Button textColor="#FFF" buttonColor="#FF3B30" loading={deleting} onPress={handleDelete}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Error Alert Dialog */}
        <Dialog
          visible={errorVisible}
          onDismiss={() => setErrorVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 24 }}
        >
          <View style={{ alignItems: 'center', paddingTop: 24 }}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
            <Dialog.Title style={{ color: '#FF3B30', marginTop: 12, marginBottom: 0 }}>Error</Dialog.Title>
          </View>
          <Dialog.Content style={{ marginTop: 12 }}>
            <ThemedText style={{ color: colors.text, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              {errorMsg}
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 16 }}>
            <Button 
              mode="contained"
              buttonColor="#FF3B30" 
              textColor="#FFFFFF"
              onPress={() => setErrorVisible(false)}
              style={{ borderRadius: 12, paddingHorizontal: 32 }}
            >
              Understood
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Success Alert Dialog */}
        <Dialog
          visible={successVisible}
          onDismiss={() => setSuccessVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 24 }}
        >
          <View style={{ alignItems: 'center', paddingTop: 24 }}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Dialog.Title style={{ color: '#10B981', marginTop: 12, marginBottom: 0 }}>Success</Dialog.Title>
          </View>
          <Dialog.Content style={{ marginTop: 12 }}>
            <ThemedText style={{ color: colors.text, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              {successMsg}
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 16 }}>
            <Button 
              mode="contained"
              buttonColor="#10B981" 
              textColor="#FFFFFF"
              onPress={() => setSuccessVisible(false)}
              style={{ borderRadius: 12, paddingHorizontal: 32 }}
            >
              Okay
            </Button>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
  tabletGridWrapper: {
    justifyContent: 'space-between',
  },
});
