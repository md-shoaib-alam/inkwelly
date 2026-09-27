import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { StaffCard } from '@/components/staff/StaffCard';
import { StaffMember, CustomRole } from '@/components/admin/staff/types';
import { StaffListCard } from '@/components/admin/staff/StaffListCard';
import { AddStaffDialog } from '@/components/admin/staff/AddStaffDialog';

export default function StaffScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();

  const isTablet = width >= 650;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  // Form dialog states (staff uses modal dialog, not sliding screen)
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom alert dialog states
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchStaffAndRoles = useCallback(async () => {
    try {
      const [resStaff, resRoles] = await Promise.all([
        api.get<any>('/staff'),
        api.get<any>('/roles')
      ]);

      if (Array.isArray(resStaff)) {
        setStaff(resStaff);
      } else if (resStaff && Array.isArray(resStaff.items)) {
        setStaff(resStaff.items);
      }

      if (Array.isArray(resRoles)) {
        setRoles(resRoles);
      }
      adminCache.markFetched('staff');
    } catch (error) {
      console.error('Failed to fetch staff list or roles:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Subscribe to mutations (Add, Edit, Delete from other screens/dialogs)
  useEffect(() => {
    const unsubscribe = adminCache.subscribe('staff', () => {
      fetchStaffAndRoles();
    });
    return unsubscribe;
  }, [fetchStaffAndRoles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (adminCache.isFresh('staff') && staff.length > 0) {
        return;
      }
      fetchStaffAndRoles();
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchStaffAndRoles, staff.length]);

  useFocusEffect(
    useCallback(() => {
      // Only re-fetch if cache expired or list is empty
      if (!adminCache.isFresh('staff') || staff.length === 0) {
        fetchStaffAndRoles();
      }
      return () => {
        setActiveMenuId(null);
      };
    }, [fetchStaffAndRoles, staff.length])
  );

  const handleRefresh = useCallback(() => {
    setActiveMenuId(null);
    setIsRefreshing(true);
    adminCache.invalidate('staff');
    fetchStaffAndRoles();
  }, [fetchStaffAndRoles]);

  const handleOpenCreate = useCallback(() => {
    setDialogMode('create');
    setEditingStaff(null);
    setDialogVisible(true);
  }, []);

  const handleOpenEdit = useCallback((member: StaffMember) => {
    setDialogMode('edit');
    setEditingStaff(member);
    setDialogVisible(true);
  }, []);

  const handleSubmit = useCallback(async (data: any) => {
    try {
      setIsSubmitting(true);
      const requestData = {
        ...data,
        role: 'staff',
      };

      if (dialogMode === 'create') {
        await api.post('/staff', requestData);
        adminCache.invalidate('staff');
      } else {
        await api.put(`/staff`, { id: editingStaff?.id, ...requestData });
        adminCache.invalidate('staff', editingStaff?.id);
      }
      setDialogVisible(false);
      fetchStaffAndRoles();
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to save staff member.');
      setErrorVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [dialogMode, editingStaff, fetchStaffAndRoles]);

  const handleDeleteClick = useCallback((member: StaffMember) => {
    setMemberToDelete(member);
    setDeleteConfirmVisible(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      // Optimistic local state removal
      setStaff(prev => prev.filter(m => m.id !== id));
      await api.delete(`/staff?id=${id}`);
      adminCache.invalidate('staff', id);
      fetchStaffAndRoles();
    } catch {
      setErrorMsg('Failed to delete staff member.');
      setErrorVisible(true);
      fetchStaffAndRoles();
    }
  }, [fetchStaffAndRoles]);

  // Memoize search filtration to optimize rendering time complexity to O(N)
  const filteredStaff = useMemo(() => {
    return staff.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [staff, search]);

  const handlePressListItem = useCallback((member: StaffMember) => {
    router.push({ pathname: '/(admin)/staff/[id]', params: { id: member.id } });
  }, [router]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
        <View style={styles.headerRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              placeholder="Search staff by name or email..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }]}
            />
          </View>
          <View style={[styles.viewToggleContainer, { backgroundColor: colors.backgroundElement }]}>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'table' && [styles.toggleBtnActive, { backgroundColor: colors.background }]]}
              onPress={() => setViewMode('table')}
              accessibilityRole="button"
              accessibilityLabel="List view"
            >
              <Ionicons name="list" size={18} color={viewMode === 'table' ? '#007AFF' : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'grid' && [styles.toggleBtnActive, { backgroundColor: colors.background }]]}
              onPress={() => setViewMode('grid')}
              accessibilityRole="button"
              accessibilityLabel="Grid view"
            >
              <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? '#007AFF' : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          key={`${viewMode}-${isTablet ? 'tablet' : 'mobile'}`}
          data={filteredStaff}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? (isTablet ? 2 : 1) : 1}
          columnWrapperStyle={viewMode === 'grid' && isTablet ? styles.gridRow : undefined}

          renderItem={viewMode === 'grid' 
            ? ({ item }) => (
                <StaffCard 
                  member={item as any} 
                  onEdit={handleOpenEdit as any} 
                  onDelete={handleDeleteClick as any} 
                  onPress={handlePressListItem as any}
                  isAdmin={isAdmin} 
                  menuVisible={activeMenuId === item.id}
                  onToggleMenu={(visible) => setActiveMenuId(visible ? item.id : null)}
                />
              )
            : ({ item }) => (
                <StaffListCard 
                  item={item}
                  colors={colors}
                  isAdmin={isAdmin}
                  onPress={handlePressListItem}
                  onEdit={handleOpenEdit}
                  onDeleteClick={handleDeleteClick}
                  menuVisible={activeMenuId === item.id}
                  onToggleMenu={(visible) => setActiveMenuId(visible ? item.id : null)}
                />
              )
          }
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#E5E5E5" />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No staff members found.</ThemedText>
            </View>
          }
        />
      )}

      {isAdmin && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleOpenCreate}
          color="#FFF"
        />
      )}

      {/* Staff Editor Dialog Form */}
      <AddStaffDialog 
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        dialogMode={dialogMode}
        editingStaff={editingStaff}
        isSubmitting={isSubmitting}
        roles={roles}
        colors={colors}
        activeTheme={activeTheme}
        onSubmit={handleSubmit}
      />

      {/* Custom Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, alignSelf: 'center', maxWidth: 340, width: '85%', borderRadius: 24 }}
        >
          <Dialog.Title style={{ color: colors.text, textAlign: 'center', fontSize: 18, fontWeight: '700' }}>Delete Staff Record</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
              Are you sure you want to permanently delete staff member "{memberToDelete?.name}"? This action is irreversible.
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'center' }}>
            <Button 
              mode="outlined" 
              textColor={colors.textSecondary} 
              style={{ borderRadius: 999, borderColor: colors.backgroundSelected, flex: 1 }} 
              labelStyle={{ fontWeight: '600' }}
              onPress={() => setDeleteConfirmVisible(false)}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              buttonColor="#FF3B30" 
              textColor="#FFFFFF" 
              style={{ borderRadius: 999, flex: 1 }}
              labelStyle={{ fontWeight: '700' }}
              onPress={async () => {
                if (memberToDelete) {
                  await handleDelete(memberToDelete.id);
                  setDeleteConfirmVisible(false);
                }
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Custom Error Dialog */}
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
          <Dialog.Actions style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              style={{ borderRadius: 20, minWidth: 100 }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={() => setErrorVisible(false)}
            >
              OK
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
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
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 12,
    fontSize: 14,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 2,
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
  gridRow: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: '#34C759',
  },
});
