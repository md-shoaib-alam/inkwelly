import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, useWindowDimensions, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useRouter } from 'expo-router';

// Subcomponents
import { Class, TeacherInfo } from '@/modules/academics/components/adminClasses/types';
import { ClassCard } from '@/modules/academics/components/adminClasses/ClassCard';
import { AddClassDialog } from '@/modules/academics/components/adminClasses/AddClassDialog';
import { ClassDetailDialog } from '@/modules/academics/components/adminClasses/ClassDetailDialog';
import { OfflineState } from '@/components/OfflineState';

export default function ClassesScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();
  const router = useRouter();

  const isTablet = width >= 650;

  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Form states for creating/editing classes
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // There is no `name` state: the server derives the class name from the level, so
  // the level picker is the only control that identifies the class.
  const [classLevel, setClassLevel] = useState('');
  const [section, setSection] = useState('A');
  const [capacity, setCapacity] = useState('40');
  const [classTeacherId, setClassTeacherId] = useState('');

  // Alert/Delete dialog states
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canCreate = isAdmin;

  const fetchClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsOffline(false);
      const res = await api.get<any>('/classes', {
        params: {
          search: search || undefined,
        }
      });
      setClasses(Array.isArray(res) ? res : res.items || []);
    } catch (error: any) {
      console.error('Failed to fetch classes:', error);
      if (error?.message && (error.message.includes('internet') || error.message.includes('network') || error.message.includes('connect'))) {
        setIsOffline(true);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  const fetchTeachers = async () => {
    try {
      const res = await api.get<any>('/teachers?mode=min');
      setTeachers(Array.isArray(res) ? res : res.items || []);
    } catch (error) {
      console.error('Failed to fetch teachers min:', error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchClasses]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchClasses();
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setEditingClass(null);
    setSection('A');
    setClassLevel('');
    setCapacity('40');
    setClassTeacherId('');
    setDialogVisible(true);
  };

  const handleOpenEdit = (cls: Class) => {
    setDialogMode('edit');
    setEditingClass(cls);
    setSection(cls.section || 'A');
    setClassLevel(cls.classLevel || '');
    setCapacity(String(cls.capacity || 40));
    setClassTeacherId(cls.classTeacherId || '');
    setDialogVisible(true);
  };

  const handleSubmit = async () => {
    if (!classLevel.trim()) {
      setErrorMsg('Please select a class level.');
      setErrorVisible(true);
      return;
    }

    try {
      setIsSubmitting(true);
      // `name` and `slug` are absent on purpose: CreateClassSchema takes the level and
      // the server derives the name from it, so a client cannot disagree with that rule.
      const payload = {
        section: section.trim() || 'A',
        classLevel: classLevel.trim(),
        capacity: parseInt(capacity) || 40,
        classTeacherId: classTeacherId || null,
      };

      const matchesSearch = (item: any) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        const className = (item.name || '').toLowerCase();
        const classSec = (item.section || '').toLowerCase();
        const classLevelText = (item.classLevel !== undefined && item.classLevel !== null ? String(item.classLevel) : '').toLowerCase();
        return className.includes(q) || classSec.includes(q) || classLevelText.includes(q);
      };

      if (dialogMode === 'create') {
        const newClass: any = await api.post('/classes', payload);
        setSuccessMsg(`Class "${newClass?.name ?? classLevel.trim()}" created successfully!`);
        if (newClass && newClass.id) {
          if (matchesSearch(newClass)) {
            setClasses(prev => [...prev, newClass]);
          }
        } else {
          fetchClasses();
        }
      } else {
        const targetId = editingClass?.id;
        await api.put('/classes', { id: targetId, ...payload });
        setSuccessMsg('Class updated successfully!');
        // A level change renames the class on the server, and the name is no longer
        // something this screen holds — so reload rather than merge the row locally.
        if (targetId) fetchClasses();
      }
      setDialogVisible(false);
      setSuccessVisible(true);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to save class record.');
      setErrorVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (cls: Class) => {
    setClassToDelete(cls);
    setDeleteConfirmVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/classes?id=${id}`);
      setSuccessMsg('Class deleted successfully!');
      setSuccessVisible(true);
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to delete class.');
      setErrorVisible(true);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search classes by name or section..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }]}
          />
        </View>
      </View>

      {/* Classes List */}
      {isOffline && classes.length === 0 ? (
        <OfflineState onRetry={fetchClasses} isRetrying={isLoading} />
      ) : isLoading && classes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          key={isTablet ? 'tablet-grid' : 'mobile-list'}
          data={classes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={isTablet ? 2 : 1}
          columnWrapperStyle={isTablet ? styles.tabletGridWrapper : undefined}

          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#E5E5E5" />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No classes found.</ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <ClassCard
              item={item}
              colors={colors}
              activeTheme={activeTheme}
              isTablet={isTablet}
              isAdmin={isAdmin}
              onPress={() => {
                setSelectedClass(item);
                setDetailVisible(true);
              }}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDeleteClick(item)}
              onViewStudents={() => {
                router.push({
                  pathname: '/(admin)/(tabs)/students',
                  params: { classId: item.id }
                });
              }}
            />
          )}
        />
      )}

      {canCreate && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: '#10B981' }]}
          onPress={handleOpenCreate}
          color="#FFF"
        />
      )}

      {/* Class Profile Details Modal */}
      <ClassDetailDialog
        visible={detailVisible}
        onDismiss={() => setDetailVisible(false)}
        colors={colors}
        activeTheme={activeTheme}
        selectedClass={selectedClass}
        isAdmin={isAdmin}
        onEdit={() => {
          setDetailVisible(false);
          if (selectedClass) handleOpenEdit(selectedClass);
        }}
        onDelete={() => {
          setDetailVisible(false);
          if (selectedClass) handleDeleteClick(selectedClass);
        }}
      />

      {/* Class Create/Edit Dialog */}
      <AddClassDialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        colors={colors}
        activeTheme={activeTheme}
        dialogMode={dialogMode}
        section={section}
        setSection={setSection}
        classLevel={classLevel}
        setClassLevel={setClassLevel}
        capacity={capacity}
        setCapacity={setCapacity}
        classTeacherId={classTeacherId}
        setClassTeacherId={setClassTeacherId}
        teachers={teachers}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Delete Class Record</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>
              Are you sure you want to permanently delete class "{classToDelete?.name}"? All student enrollments must be transferred first. This action is irreversible.
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setDeleteConfirmVisible(false)}>Cancel</Button>
            <Button
              buttonColor="#FF3B30"
              textColor="#FFFFFF"
              onPress={async () => {
                if (classToDelete) {
                  await handleDelete(classToDelete.id);
                  setDeleteConfirmVisible(false);
                }
              }}
            >
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
            <Dialog.Title style={{ color: '#FF3B30', marginTop: 12, marginBottom: 0 }}>Operation Failed</Dialog.Title>
          </View>
          <Dialog.Content style={{ marginTop: 12 }}>
            <ThemedText style={{ color: colors.text, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              {errorMsg}
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 16 }}>
            <Button 
              mode="contained"
              buttonColor="#10B981" 
              textColor="#FFFFFF"
              onPress={() => setErrorVisible(false)}
              style={{ borderRadius: 12, paddingHorizontal: 24 }}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 38,
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
});
