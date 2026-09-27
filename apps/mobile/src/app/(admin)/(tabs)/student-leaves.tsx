import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { LeaveRequest, STATUS_CONFIG, LEAVE_TYPE_CONFIG } from '@/components/admin/leaves/types';
import { LeaveRequestCard } from '@/components/admin/leaves/LeaveRequestCard';
import { LeaveActionDialog } from '@/components/admin/leaves/LeaveActionDialog';

export default function StudentLeavesScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject'>('approve');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter pickers visibility
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [typePickerVisible, setTypePickerVisible] = useState(false);

  const fetchLeaves = useCallback(async () => {
    try {
      const params: Record<string, string> = { role: 'student' };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.leaveType = typeFilter;

      const res = await api.get('/leaves', { params });
      if (Array.isArray(res)) {
        setLeaves(res);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.error('Failed to fetch student leaves:', error);
      setLeaves([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchLeaves();
  }, [fetchLeaves]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaves();
  };

  const openActionDialog = (leave: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedLeave(leave);
    setDialogAction(action);
    setDialogVisible(true);
  };

  const handleActionConfirm = async (remarks: string) => {
    if (!selectedLeave) return;
    try {
      setIsSubmitting(true);
      await api.put('/leaves', {
        id: selectedLeave.id,
        status: dialogAction === 'approve' ? 'approved' : 'rejected',
        approverRemarks: remarks.trim() || undefined,
      });
      setDialogVisible(false);
      fetchLeaves();
    } catch (error) {
      console.error('Failed to update student leave request status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Filters Bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.backgroundSelected }]}>
        <TouchableOpacity 
          style={[styles.filterDropdown, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]} 
          onPress={() => setStatusPickerVisible(true)}
        >
          <Ionicons name="funnel-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <ThemedText style={{ fontSize: 13, color: colors.text, flex: 1 }} numberOfLines={1}>
            Status: {statusFilter === 'all' ? 'All' : STATUS_CONFIG[statusFilter]?.label || statusFilter}
          </ThemedText>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterDropdown, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]} 
          onPress={() => setTypePickerVisible(true)}
        >
          <Ionicons name="filter-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <ThemedText style={{ fontSize: 13, color: colors.text, flex: 1 }} numberOfLines={1}>
            Type: {typeFilter === 'all' ? 'All' : LEAVE_TYPE_CONFIG[typeFilter]?.label || typeFilter}
          </ThemedText>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlashList
          data={leaves}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeaveRequestCard 
              item={item}
              colors={colors}
              onOpenActionDialog={openActionDialog}
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.backgroundSelected} />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                No student leave requests found.
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Status Picker Dialog */}
      <Portal>
        <Dialog 
          visible={statusPickerVisible} 
          onDismiss={() => setStatusPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Filter by Status</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView>
              {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((status) => (
                <TouchableOpacity 
                  key={status}
                  style={styles.pickerItem}
                  onPress={() => {
                    setStatusFilter(status);
                    setStatusPickerVisible(false);
                  }}
                >
                  <ThemedText style={{ color: statusFilter === status ? '#007AFF' : colors.text, fontWeight: statusFilter === status ? '700' : 'normal' }}>
                    {status === 'all' ? 'All Statuses' : STATUS_CONFIG[status]?.label || status}
                  </ThemedText>
                  {statusFilter === status && <Ionicons name="checkmark" size={18} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setStatusPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Type Picker Dialog */}
        <Dialog 
          visible={typePickerVisible} 
          onDismiss={() => setTypePickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Filter by Leave Type</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView>
              {['all', 'casual', 'sick', 'earned', 'maternity', 'paternity', 'duty'].map((type) => (
                <TouchableOpacity 
                  key={type}
                  style={styles.pickerItem}
                  onPress={() => {
                    setTypeFilter(type);
                    setTypePickerVisible(false);
                  }}
                >
                  <ThemedText style={{ color: typeFilter === type ? '#007AFF' : colors.text, fontWeight: typeFilter === type ? '700' : 'normal' }}>
                    {type === 'all' ? 'All Types' : LEAVE_TYPE_CONFIG[type]?.label || type}
                  </ThemedText>
                  {typeFilter === type && <Ionicons name="checkmark" size={18} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setTypePickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Approve/Reject Confirmation Dialog */}
      <LeaveActionDialog 
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        dialogAction={dialogAction}
        selectedLeave={selectedLeave}
        isSubmitting={isSubmitting}
        colors={colors}
        onConfirm={handleActionConfirm}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  filterDropdown: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
});
