import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-context';
import { Notice } from '@/components/admin/notices/types';
import { NoticeCard } from '@/components/admin/notices/NoticeCard';
import { AddNoticeDialog } from '@/components/admin/notices/AddNoticeDialog';
import { Portal, Dialog, Button } from 'react-native-paper';

export default function SchoolNoticesScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Dialog states
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletingNoticeId, setDeletingNoticeId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Custom Success/Error dialog states
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const loadNotices = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await api.get<Notice[]>('/notices');
      if (res) {
        setNotices(res);
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotices(false);
  };

  const handleSaveNotice = async (data: { title: string; content: string; priority: string; targetRole: string }) => {
    setSubmitting(true);
    try {
      if (createVisible) {
        await api.post('/notices', data);
        setSuccessMsg('Notice created successfully!');
        setSuccessVisible(true);
        setCreateVisible(false);
      } else if (editVisible && editingNotice) {
        await api.put('/notices', {
          id: editingNotice.id,
          ...data,
        });
        setSuccessMsg('Notice updated successfully!');
        setSuccessVisible(true);
        setEditVisible(false);
      }
      setEditingNotice(null);
      loadNotices(false);
    } catch (error) {
      setErrorMsg('Failed to save notice.');
      setErrorVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setEditVisible(true);
  };

  const handleDelete = (id: string) => {
    setDeletingNoticeId(id);
    setDeleteVisible(true);
  };

  const confirmDelete = async () => {
    if (!deletingNoticeId) return;
    setDeleting(true);
    try {
      await api.delete(`/notices?id=${deletingNoticeId}`);
      setSuccessMsg('Notice deleted successfully!');
      setSuccessVisible(true);
      setDeleteVisible(false);
      setDeletingNoticeId(null);
      loadNotices(false);
    } catch (error) {
      setErrorMsg('Failed to delete notice.');
      setErrorVisible(true);
    } finally {
      setDeleting(false);
    }
  };

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === 'all' || n.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [notices, search, priorityFilter]);

  return (
    <ThemedView style={styles.container} safeAreaTop>
      {/* Header bar with Back button */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.backgroundSelected }]} 
          onPress={() => router.push('/(admin)/(tabs)/more')}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>School Notices</ThemedText>
        {isAdmin ? (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              setEditingNotice(null);
              setCreateVisible(true);
            }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Search & Filter bar */}
      <View style={styles.filterBar}>
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search notices..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.prioritySelector}>
          {['all', 'normal', 'high'].map((p) => {
            const isSelected = priorityFilter === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPriorityFilter(p)}
                style={[
                  styles.filterBtn,
                  { 
                    backgroundColor: isSelected ? '#007AFF' : colors.backgroundElement,
                    borderColor: isSelected ? '#007AFF' : colors.backgroundSelected 
                  }
                ]}
              >
                <ThemedText style={{ color: isSelected ? '#FFF' : colors.text, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                  {p}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={{ marginTop: 10, color: colors.textSecondary }}>Fetching notices...</ThemedText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
          }
        >
          {filteredNotices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12, opacity: 0.4 }} />
              <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                No notices found matching your criteria.
              </ThemedText>
            </View>
          ) : (
            filteredNotices.map((notice) => (
              <NoticeCard 
                key={notice.id}
                notice={notice}
                colors={colors}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Create / Edit Dialog */}
      <AddNoticeDialog 
        visible={createVisible || editVisible}
        onDismiss={() => {
          setCreateVisible(false);
          setEditVisible(false);
          setEditingNotice(null);
        }}
        editingNotice={editingNotice}
        submitting={submitting}
        colors={colors}
        onSave={handleSaveNotice}
      />

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteVisible}
          onDismiss={() => {
            if (!deleting) {
              setDeleteVisible(false);
              setDeletingNoticeId(null);
            }
          }}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}
        >
          <Dialog.Title style={{ color: colors.text }}>Delete Notice</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.textSecondary }}>
              Are you sure you want to delete this notice?
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
            <Button
              mode="outlined"
              textColor={colors.textSecondary}
              disabled={deleting}
              onPress={() => {
                setDeleteVisible(false);
                setDeletingNoticeId(null);
              }}
              style={{ borderRadius: 999, borderColor: colors.backgroundSelected }}
              contentStyle={{ paddingHorizontal: 16, paddingVertical: 2 }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              textColor="#FFF"
              buttonColor="#FF3B30"
              loading={deleting}
              disabled={deleting}
              onPress={confirmDelete}
              style={{ borderRadius: 999 }}
              contentStyle={{ paddingHorizontal: 16, paddingVertical: 2 }}
            >
              Delete
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
              buttonColor="#FF3B30" 
              textColor="#FFFFFF"
              onPress={() => setErrorVisible(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
