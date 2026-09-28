import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, useWindowDimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { RoleRecord, StaffMember } from '@/modules/access-control/components/adminRoles/types';
import { RoleCard } from '@/modules/access-control/components/adminRoles/RoleCard';
import { AddRoleDialog } from '@/modules/access-control/components/adminRoles/AddRoleDialog';
import { AssignStaffDialog } from '@/modules/access-control/components/adminRoles/AssignStaffDialog';

export default function RolesScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog management
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // User assignment dialog state
  const [assignVisible, setAssignVisible] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleRecord | null>(null);
  const [assigningUser, setAssigningUser] = useState<string | null>(null);

  // Custom Confirmation Dialog states
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
  const [deleteErrorVisible, setDeleteErrorVisible] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const numColumns = width >= 650 ? 2 : 1;

  const fetchData = useCallback(async () => {
    try {
      const [resRoles, resStaff] = await Promise.all([
        api.get('/roles'),
        api.get('/staff')
      ]);

      if (Array.isArray(resRoles)) {
        setRoles(resRoles);
      }
      if (Array.isArray(resStaff)) {
        setStaff(resStaff);
      } else if (resStaff && Array.isArray(resStaff.items)) {
        setStaff(resStaff.items);
      }
    } catch (error) {
      console.error('Failed to fetch roles or staff:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pre-calculate user counts per role for O(N + M) complexity rendering
  const roleUserCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    staff.forEach(member => {
      if (member.customRole?.id) {
        counts[member.customRole.id] = (counts[member.customRole.id] || 0) + 1;
      }
    });
    return counts;
  }, [staff]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = useCallback(() => {
    setDialogMode('create');
    setEditingRole(null);
    setDialogVisible(true);
  }, []);

  const handleOpenEdit = useCallback((role: RoleRecord) => {
    setDialogMode('edit');
    setEditingRole(role);
    setDialogVisible(true);
  }, []);

  const handleSave = useCallback(async (data: { name: string; description: string; color: string; permissions: Record<string, string[]> }) => {
    try {
      setIsSaving(true);
      if (dialogMode === 'create') {
        await api.post('/roles', data);
      } else {
        await api.put('/roles', { id: editingRole?.id, ...data });
      }
      setDialogVisible(false);
      fetchData();
    } catch (error: any) {
      setDeleteErrorMsg(error.message || 'Failed to save role.');
      setDeleteErrorVisible(true);
    } finally {
      setIsSaving(false);
    }
  }, [dialogMode, editingRole, fetchData]);

  const handleDeleteClick = useCallback((role: RoleRecord) => {
    const count = roleUserCounts[role.id] || 0;
    if (count > 0) {
      setDeleteErrorMsg(`This role is currently assigned to ${count} staff members. Unassign them first.`);
      setDeleteErrorVisible(true);
      return;
    }
    setRoleToDelete(role);
    setDeleteConfirmVisible(true);
  }, [roleUserCounts]);

  const handleDeleteRole = useCallback(async (id: string) => {
    try {
      await api.delete(`/roles?id=${id}`);
      fetchData();
    } catch {
      setDeleteErrorMsg('Failed to delete custom role.');
      setDeleteErrorVisible(true);
    }
  }, [fetchData]);

  const handleOpenAssign = useCallback((role: RoleRecord) => {
    setActiveRole(role);
    setAssignVisible(true);
  }, []);

  const handleAssignToggle = useCallback(async (member: StaffMember, isAssigned: boolean) => {
    if (!activeRole) return;
    try {
      setAssigningUser(member.id);
      await api.patch('/roles/users', {
        userId: member.id,
        roleId: isAssigned ? null : activeRole.id,
      });
      await fetchData();
    } catch (error: any) {
      setDeleteErrorMsg(error.message || 'Failed to update user assignment.');
      setDeleteErrorVisible(true);
    } finally {
      setAssigningUser(null);
    }
  }, [activeRole, fetchData]);

  return (
    <ThemedView style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          key={`${numColumns}`}
          data={roles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RoleCard 
              item={item}
              assignedCount={roleUserCounts[item.id] || 0}
              isAdmin={isAdmin}
              numColumns={numColumns}
              colors={colors}
              activeTheme={activeTheme}
              onOpenAssign={handleOpenAssign}
              onOpenEdit={handleOpenEdit}
              onDeleteClick={handleDeleteClick}
            />
          )}
          numColumns={numColumns}

          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-outline" size={64} color="#E5E5E5" />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No custom roles created yet.</ThemedText>
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

      {/* Role Creator / Editor Dialog */}
      <AddRoleDialog 
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        dialogMode={dialogMode}
        editingRole={editingRole}
        isSaving={isSaving}
        colors={colors}
        activeTheme={activeTheme}
        onSave={handleSave}
      />

      {/* Assign Users Dialog */}
      <AssignStaffDialog 
        visible={assignVisible}
        onDismiss={() => setAssignVisible(false)}
        activeRole={activeRole}
        staff={staff}
        assigningUser={assigningUser}
        colors={colors}
        onAssignToggle={handleAssignToggle}
      />

      {/* Custom Confirmation Alert Dialog */}
      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Delete Custom Role</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>
              Are you sure you want to permanently delete custom role "{roleToDelete?.name}"? This action is irreversible.
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ gap: 10, paddingBottom: 16, paddingHorizontal: 16 }}>
            <Button 
              mode="outlined" 
              textColor="#007AFF" 
              style={{ borderRadius: 20, borderColor: '#007AFF', borderWidth: 1, minWidth: 100 }} 
              labelStyle={{ fontWeight: '600' }}
              onPress={() => setDeleteConfirmVisible(false)}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              buttonColor="#FF3B30" 
              textColor="#FFFFFF" 
              style={{ borderRadius: 20, minWidth: 100 }}
              labelStyle={{ fontWeight: '700' }}
              onPress={async () => {
                if (roleToDelete) {
                  await handleDeleteRole(roleToDelete.id);
                  setDeleteConfirmVisible(false);
                }
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Custom Alert Error Dialog */}
        <Dialog
          visible={deleteErrorVisible}
          onDismiss={() => setDeleteErrorVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: '#FF3B30' }}>Action Denied</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>
              {deleteErrorMsg}
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              style={{ borderRadius: 20, minWidth: 100 }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={() => setDeleteErrorVisible(false)}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  gridRowWrapper: {
    justifyContent: 'flex-start',
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
