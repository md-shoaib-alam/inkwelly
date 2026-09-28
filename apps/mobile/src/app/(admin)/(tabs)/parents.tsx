import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, useWindowDimensions, FlatList, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Dialog, Button, FAB } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { adminCache } from '@/lib/adminCache';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

// Subcomponents
import { Child, Parent, StudentMin } from '@/modules/people/components/adminParents/types';
import { ParentCard } from '@/modules/people/components/adminParents/ParentCard';

export default function ParentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();

  const isTablet = width >= 650;

  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Linking child states
  const [linkDialogVisible, setLinkDialogVisible] = useState(false);
  const [unlinkedStudents, setUnlinkedStudents] = useState<StudentMin[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Alert dialog states
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
  const [unlinkConfirmVisible, setUnlinkConfirmVisible] = useState(false);
  const [childToUnlink, setChildToUnlink] = useState<Child | null>(null);

  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canCreate = isAdmin;

  const fetchParents = useCallback(async (pageNum: number, shouldAppend: boolean = false) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const res: any = await api.get('/parents', {
        params: {
          page: pageNum,
          limit: 20,
          search: search || undefined,
        }
      });

      if (shouldAppend) {
        setParents(prev => [...prev, ...res.items]);
      } else {
        setParents(res.items);
      }
      setTotalPages(res.totalPages);
      setPage(pageNum);
      if (pageNum === 1 && !search) {
        adminCache.markFetched('parents');
      }
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [search]);

  // Subscribe to mutations (Add, Edit, Delete from other screens)
  useEffect(() => {
    const unsubscribe = adminCache.subscribe('parents', () => {
      fetchParents(1);
    });
    return unsubscribe;
  }, [fetchParents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!search && adminCache.isFresh('parents') && parents.length > 0) {
        return;
      }
      fetchParents(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchParents, search]);

  useFocusEffect(
    useCallback(() => {
      // Re-fetch parent list on focus only if cache expired or list empty
      if (!adminCache.isFresh('parents') || parents.length === 0) {
        fetchParents(1);
      }
      return () => {
        setActiveMenuId(null);
      };
    }, [fetchParents, parents.length])
  );

  const handleRefresh = () => {
    setActiveMenuId(null);
    setIsRefreshing(true);
    adminCache.invalidate('parents');
    fetchParents(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchParents(page + 1, true);
    }
  };

  const handleOpenCreate = () => {
    router.push({ pathname: '/(admin)/parents/new' });
  };

  const handleOpenEdit = (parent: Parent) => {
    router.push({
      pathname: '/(admin)/parents/new',
      params: {
        mode: 'edit',
        id: parent.id,
        name: parent.name,
        username: parent.username || '',
        email: parent.email || '',
        phone: parent.phone || '',
        alternatePhone: (parent as any).alternatePhone || '',
        occupation: parent.occupation || '',
        gender: (parent as any).gender || 'male',
        dateOfBirth: (parent as any).dateOfBirth || '',
        address: (parent as any).address || '',
      },
    });
  };

  const handleDeleteClick = (parent: Parent) => {
    setParentToDelete(parent);
    setDeleteConfirmVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Optimistically remove from UI immediately
      setParents(prev => prev.filter(p => p.id !== id && p.userId !== id));
      await api.delete(`/parents?id=${id}`);
      fetchParents(1);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to delete parent record.');
      setErrorVisible(true);
      fetchParents(1);
    }
  };

  const fetchUnlinkedStudents = useCallback(async () => {
    if (!linkDialogVisible) return;
    try {
      setLoadingStudents(true);
      const res: any = await api.get('/students', {
        params: {
          mode: 'min',
          limit: 50,
          unlinkedOnly: 'true',
          search: studentSearch || undefined,
        }
      });
      setUnlinkedStudents(res.items || []);
    } catch (error) {
      console.error('Failed to fetch unlinked students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, [linkDialogVisible, studentSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnlinkedStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUnlinkedStudents]);

  const handleLinkChild = async (studentId: string) => {
    if (!selectedParent) return;
    try {
      setIsSubmitting(true);
      await api.post('/parents', {
        action: 'link',
        parentId: selectedParent.id,
        studentId,
      });
      setLinkDialogVisible(false);
      
      // Update selected parent's children locally
      const linkedStudent = unlinkedStudents.find(s => s.id === studentId);
      let updatedSel: Parent | null = null;
      const updatedParents = parents.map(p => {
        if (p.id === selectedParent.id) {
          const children = p.children || [];
          updatedSel = {
            ...p,
            children: linkedStudent ? [...children, linkedStudent] : children
          };
          return updatedSel;
        }
        return p;
      });

      setParents(updatedParents);
      if (updatedSel) {
        setSelectedParent(updatedSel);
      }

      // Remove linked student from local unlinked list
      setUnlinkedStudents(prev => prev.filter(s => s.id !== studentId));
      Alert.alert('Success', 'Student linked successfully!');
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to link student.');
      setErrorVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkClick = (parent: Parent, child: Child) => {
    setSelectedParent(parent);
    setChildToUnlink(child);
    setUnlinkConfirmVisible(true);
  };

  const handleUnlinkChild = async () => {
    if (!selectedParent || !childToUnlink) return;
    const targetChild = childToUnlink;
    const targetParentId = selectedParent.id;

    try {
      setIsSubmitting(true);
      await api.post('/parents', {
        action: 'unlink',
        parentId: targetParentId,
        studentId: targetChild.id,
      });

      // 1. Immediately close confirmation dialog & clear target child state
      setUnlinkConfirmVisible(false);
      setChildToUnlink(null);

      // 2. Immediately update local parents array state
      let updatedSel: Parent | null = null;
      const updatedParents = parents.map(p => {
        if (p.id === targetParentId) {
          const newChildren = (p.children || []).filter(c => c.id !== targetChild.id);
          updatedSel = { ...p, children: newChildren };
          return updatedSel;
        }
        return p;
      });

      setParents(updatedParents);

      // 3. Immediately update selectedParent state with fresh object reference
      if (updatedSel) {
        setSelectedParent(updatedSel);
      }

      // 4. Add unlinked student to local unlinkedStudents state
      setUnlinkedStudents(prev => {
        if (prev.some(s => s.id === targetChild.id)) return prev;
        return [targetChild, ...prev];
      });

      Alert.alert('Success', `Successfully unlinked "${targetChild.name}".`);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to unlink student.');
      setErrorVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Top Header Actions */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search parents or children..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }]}
          />
        </View>
      </View>

      {/* Parents Grid / List */}
      {isLoading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <FlatList
          key={isTablet ? 'tablet-grid' : 'mobile-list'}
          data={parents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ParentCard
              item={item}
              colors={colors}
              activeTheme={activeTheme}
              isTablet={isTablet}
              isAdmin={isAdmin}
              onPress={() => {
                router.push({ pathname: '/(admin)/parents/[id]', params: { id: item.id } });
              }}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDeleteClick(item)}
              onLinkChild={() => {
                setSelectedParent(item);
                setLinkDialogVisible(true);
              }}
              onUnlinkChild={(child) => handleUnlinkClick(item, child)}
              menuVisible={activeMenuId === item.id}
              onToggleMenu={(visible) => setActiveMenuId(visible ? item.id : null)}
            />
          )}
          contentContainerStyle={styles.listContent}
          numColumns={isTablet ? 2 : 1}
          columnWrapperStyle={isTablet ? styles.tabletGridWrapper : undefined}

          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{ padding: 16 }} color="#047857" /> : <View style={{ height: 20 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#E5E5E5" />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No parents found.</ThemedText>
            </View>
          }
        />
      )}

      {canCreate && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: '#047857' }]}
          onPress={handleOpenCreate}
          color="#FFF"
        />
      )}

      {/* Link Student Picker Dialog */}
      <Portal>
        <Dialog
          visible={linkDialogVisible}
          onDismiss={() => setLinkDialogVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Link Student to Parent</Dialog.Title>
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <View style={[styles.searchContainer, { height: 38 }]}>
              <Ionicons name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                placeholder="Search unlinked students..."
                placeholderTextColor={colors.textSecondary}
                value={studentSearch}
                onChangeText={setStudentSearch}
                style={[styles.searchInput, { height: 38, fontSize: 13, color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
              />
            </View>
          </View>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0, maxHeight: 300 }}>
            {loadingStudents ? (
              <ActivityIndicator style={{ padding: 24 }} color="#047857" />
            ) : (
              <FlatList
                data={unlinkedStudents}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.studentPickRow}
                    onPress={() => handleLinkChild(item.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontWeight: '600', fontSize: 13, color: colors.text }}>{item.name}</ThemedText>
                      <ThemedText style={{ fontSize: 11, color: colors.textSecondary }}>
                        Class: {item.className} | Roll: {item.rollNumber}
                      </ThemedText>
                    </View>
                    <Ionicons name="link-outline" size={18} color="#047857" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', padding: 24, fontSize: 13 }}>
                    No unlinked students found.
                  </ThemedText>
                }
              />
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setLinkDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
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
              Are you sure you want to permanently delete parent <ThemedText style={{ fontWeight: '700', color: colors.text }}>"{parentToDelete?.name}"</ThemedText>?
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
              style={{ flex: 1.2, borderRadius: 12, height: 42, justifyContent: 'center' }}
              labelStyle={{ fontWeight: '700', fontSize: 13 }}
              onPress={async () => {
                if (parentToDelete) {
                  await handleDelete(parentToDelete.id);
                  setDeleteConfirmVisible(false);
                }
              }}
            >
              Delete Account
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Unlink Child Confirmation Dialog */}
        <Dialog
          visible={unlinkConfirmVisible}
          onDismiss={() => setUnlinkConfirmVisible(false)}
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
              backgroundColor: '#FEF3C7',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Ionicons name="link-outline" size={26} color="#D97706" />
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
              Unlink Child
            </ThemedText>
          </View>
          <Dialog.Content style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
              Are you sure you want to unlink <ThemedText style={{ fontWeight: '700', color: colors.text }}>"{childToUnlink?.name}"</ThemedText> from this parent?
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ gap: 10, paddingBottom: 20, paddingHorizontal: 20, paddingTop: 8 }}>
            <Button 
              mode="outlined" 
              textColor={colors.text} 
              style={{ flex: 1, borderRadius: 12, borderColor: colors.backgroundSelected, borderWidth: 1, height: 42, justifyContent: 'center' }} 
              labelStyle={{ fontWeight: '600', fontSize: 13 }}
              onPress={() => setUnlinkConfirmVisible(false)}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor="#D97706"
              textColor="#FFFFFF"
              style={{ flex: 1.2, borderRadius: 12, height: 42, justifyContent: 'center' }}
              labelStyle={{ fontWeight: '700', fontSize: 13 }}
              onPress={handleUnlinkChild}
            >
              Unlink
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Error Alert Dialog */}
        <Dialog
          visible={errorVisible}
          onDismiss={() => setErrorVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: '#EF4444' }}>Operation Failed</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>{errorMsg}</ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#047857" onPress={() => setErrorVisible(false)}>Understood</Button>
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
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 0,
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
  studentPickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});
