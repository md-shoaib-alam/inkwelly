import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { 
  AcademicYear, 
  GET_ACADEMIC_YEARS, 
  CREATE_ACADEMIC_YEAR, 
  UPDATE_ACADEMIC_YEAR, 
  DELETE_ACADEMIC_YEAR, 
  SET_CURRENT_ACADEMIC_YEAR 
} from '@/components/admin/academic-years/types';
import { AcademicYearCard } from '@/components/admin/academic-years/AcademicYearCard';
import { AddAcademicYearDialog } from '@/components/admin/academic-years/AddAcademicYearDialog';

export default function AcademicYearsScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion Confirmation States
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<string | null>(null);

  // Error States
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canCreate = isAdmin;

  // GraphQL requester helper
  const executeGql = async (query: string, variables?: Record<string, any>) => {
    const res = (await api.post('/graphql', { query, variables })) as any;
    if (res.errors) {
      throw new Error(res.errors[0]?.message || 'GraphQL Request Error');
    }
    return res.data;
  };

  // Fetch academic years
  const fetchAcademicYears = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await executeGql(GET_ACADEMIC_YEARS);
      if (data && data.academicYears) {
        setAcademicYears(data.academicYears);
      }
    } catch (err) {
      console.error('Failed to fetch academic years:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAcademicYears();
  };

  // Open creation dialog
  const handleOpenCreate = () => {
    setDialogMode('create');
    setEditingYear(null);
    setDialogVisible(true);
  };

  // Open edit dialog
  const handleOpenEdit = (year: AcademicYear) => {
    setDialogMode('edit');
    setEditingYear(year);
    setDialogVisible(true);
  };

  // Set as current session
  const handleSetCurrent = async (id: string) => {
    try {
      setIsLoading(true);
      await executeGql(SET_CURRENT_ACADEMIC_YEAR, { id });
      await fetchAcademicYears();
    } catch (err) {
      setErrorMsg('Failed to update current academic year.');
      setErrorVisible(true);
      setIsLoading(false);
    }
  };

  // Delete a session
  const handleDeleteClick = (id: string) => {
    setYearToDelete(id);
    setDeleteConfirmVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await executeGql(DELETE_ACADEMIC_YEAR, { id });
      await fetchAcademicYears();
    } catch (err) {
      setErrorMsg('Failed to delete academic year session.');
      setErrorVisible(true);
    }
  };

  // Submit Form
  const handleSubmit = async (input: { name: string; startDate: string; endDate: string; status: string }) => {
    try {
      setIsSubmitting(true);
      if (dialogMode === 'create') {
        await executeGql(CREATE_ACADEMIC_YEAR, { input });
      } else {
        await executeGql(UPDATE_ACADEMIC_YEAR, { id: editingYear?.id, input });
      }

      setDialogVisible(false);
      fetchAcademicYears();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save academic year.');
      setErrorVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculated Stats
  const currentSession = useMemo(() => {
    const currentYear = academicYears.find(y => y.isCurrent);
    if (currentYear) return currentYear.name;

    const now = new Date();
    const activeByDate = academicYears.find(y => {
      const start = new Date(y.startDate);
      const end = new Date(y.endDate);
      return now >= start && now <= end;
    });
    if (activeByDate) return activeByDate.name;

    const activeStatus = academicYears.find(y => y.status === 'active');
    if (activeStatus) return activeStatus.name;

    return 'Not Set';
  }, [academicYears]);

  const activeCount = useMemo(() => {
    return academicYears.filter(y => y.status === 'active').length;
  }, [academicYears]);

  const upcomingCount = useMemo(() => {
    const now = new Date();
    return academicYears.filter(y => new Date(y.startDate) > now).length;
  }, [academicYears]);

  return (
    <ThemedView style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statsCard, { backgroundColor: colors.backgroundElement, borderColor: '#5856D6' }]}>
          <View style={styles.statsIconWrapper}>
            <Ionicons name="shield-checkmark" size={18} color="#5856D6" />
          </View>
          <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>CURRENT SESSION</ThemedText>
          <ThemedText style={[styles.statsValue, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>{currentSession}</ThemedText>
        </View>
        <View style={[styles.statsCard, { backgroundColor: colors.backgroundElement, borderColor: '#34C759' }]}>
          <View style={styles.statsIconWrapper}>
            <Ionicons name="checkmark-circle" size={18} color="#34C759" />
          </View>
          <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>ACTIVE SESSIONS</ThemedText>
          <ThemedText style={[styles.statsValue, { color: colors.text }]}>{activeCount}</ThemedText>
        </View>
        <View style={[styles.statsCard, { backgroundColor: colors.backgroundElement, borderColor: '#FF9500' }]}>
          <View style={styles.statsIconWrapper}>
            <Ionicons name="time" size={18} color="#FF9500" />
          </View>
          <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>UPCOMING</ThemedText>
          <ThemedText style={[styles.statsValue, { color: colors.text }]}>{upcomingCount}</ThemedText>
        </View>
      </View>

      {/* Main List */}
      {isLoading && academicYears.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlashList
          data={academicYears}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}

          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#E5E5E5" />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                No academic years configured.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <AcademicYearCard 
              item={item}
              colors={colors}
              activeTheme={activeTheme}
              isAdmin={isAdmin}
              onSetCurrent={handleSetCurrent}
              onEdit={handleOpenEdit}
              onDeleteClick={handleDeleteClick}
            />
          )}
        />
      )}

      {/* FAB */}
      {canCreate && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleOpenCreate}
          color="#FFF"
        />
      )}

      {/* Dialog */}
      <AddAcademicYearDialog 
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        dialogMode={dialogMode}
        editingYear={editingYear}
        isSubmitting={isSubmitting}
        colors={colors}
        activeTheme={activeTheme}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Alert */}
      <Portal>
        <Dialog visible={deleteConfirmVisible} onDismiss={() => setDeleteConfirmVisible(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Delete Academic Session</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text }}>
              Are you sure you want to permanently delete this academic session? This cannot be undone.
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setDeleteConfirmVisible(false)}>Cancel</Button>
            <Button buttonColor="#FF3B30" textColor="#FFF" onPress={async () => {
              if (yearToDelete) {
                await handleDelete(yearToDelete);
                setDeleteConfirmVisible(false);
              }
            }}>Delete</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Error Alert */}
        <Dialog visible={errorVisible} onDismiss={() => setErrorVisible(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: '#FF3B30' }}>Error</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text }}>{errorMsg}</ThemedText>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  statsCard: {
    flex: 1,
    aspectRatio: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsIconWrapper: {
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '800',
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
    backgroundColor: '#5856D6',
    borderRadius: 28,
  },
});
