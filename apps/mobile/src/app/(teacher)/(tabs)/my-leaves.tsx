import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from 'expo-router';
const TypedFlashList = FlashList as any;

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  approverRemarks?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#FF9500' },
  approved: { label: 'Approved', color: '#34C759' },
  rejected: { label: 'Rejected', color: '#FF3B30' },
  cancelled: { label: 'Cancelled', color: '#8E8E93' },
};

const LEAVE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  casual: { label: 'Casual Leave', color: '#007AFF' },
  sick: { label: 'Sick Leave', color: '#FF3B30' },
  earned: { label: 'Earned Leave', color: '#34C759' },
  maternity: { label: 'Maternity Leave', color: '#FF2D55' },
  paternity: { label: 'Paternity Leave', color: '#AF52DE' },
  duty: { label: 'Duty Leave', color: '#5856D6' },
};

const getLocalDateString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 10);
};

export default function MyLeavesScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Apply leave form dialog
  const [applyVisible, setApplyVisible] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState(() => getLocalDateString());
  const [endDate, setEndDate] = useState(() => getLocalDateString());
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Type Picker Dialog
  const [typePickerVisible, setTypePickerVisible] = useState(false);

  // Calendar Dialogs
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // Cancel Confirmation Dialog
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Feedback (Success/Error) Dialog
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const showFeedback = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackTitle(title);
    setFeedbackMessage(message);
    setFeedbackType(type);
    setFeedbackVisible(true);
  };

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 10;

  const fetchMyLeaves = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (leaves.length > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentOffset = isRefresh ? 0 : leaves.length;
      const res = await api.get('/leaves', {
        params: {
          limit: LIMIT.toString(),
          offset: currentOffset.toString()
        }
      });

      const newRecords = Array.isArray(res) ? res : [];
      
      if (isRefresh) {
        setLeaves(newRecords);
        setHasMore(newRecords.length >= LIMIT);
      } else {
        setLeaves(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const filteredNew = newRecords.filter(item => !existingIds.has(item.id));
          return [...prev, ...filteredNew];
        });
        setHasMore(newRecords.length >= LIMIT);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [leaves.length]);

  useFocusEffect(
    useCallback(() => {
      fetchMyLeaves(true);
    }, [fetchMyLeaves])
  );

  const handleRefresh = () => {
    fetchMyLeaves(true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || refreshing || loading) return;
    fetchMyLeaves(false);
  };

  const handleApply = async () => {
    if (!startDate || !endDate) {
      showFeedback('Invalid Dates', 'Please select both start and end dates.', 'error');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      showFeedback('Invalid Dates', 'End date must be after or equal to start date.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/leaves', {
        leaveType,
        startDate,
        endDate,
        reason: reason.trim() || undefined
      });
      setApplyVisible(false);
      setReason('');
      fetchMyLeaves();
      showFeedback('Success', 'Leave request submitted successfully.', 'success');
    } catch (e) {
      console.error(e);
      showFeedback('Error', 'Failed to submit leave request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (id: string) => {
    setSelectedLeaveId(id);
    setCancelVisible(true);
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <TypedFlashList
          data={leaves}
          keyExtractor={(item: LeaveRequest) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          estimatedItemSize={140}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.backgroundSelected} />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No leave requests found.</ThemedText>
            </View>
          }
          renderItem={({ item }: { item: LeaveRequest }) => {
            const typeInfo = LEAVE_TYPE_CONFIG[item.leaveType] || { label: item.leaveType, color: '#8E8E93' };
            const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, color: '#8E8E93' };
            return (
              <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: typeInfo.color + '12' }]}>
                    <ThemedText style={{ color: typeInfo.color, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
                      {typeInfo.label.toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '12' }]}>
                    <ThemedText style={{ color: statusInfo.color, fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
                      {statusInfo.label.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <ThemedText style={{ fontSize: 13, color: colors.textSecondary }}>
                    {item.startDate} to {item.endDate}
                  </ThemedText>
                </View>

                {item.reason && (
                  <View style={[styles.reasonBox, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                    <ThemedText style={{ fontSize: 12, color: colors.text }}>{item.reason}</ThemedText>
                  </View>
                )}

                {item.approverRemarks && (
                  <View style={styles.remarksBox}>
                    <ThemedText style={{ fontSize: 11, fontStyle: 'italic', color: '#FF9500' }}>
                      Admin Remarks: "{item.approverRemarks}"
                    </ThemedText>
                  </View>
                )}

                {item.status === 'pending' && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
                    <Ionicons name="close-circle-outline" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
                    <ThemedText style={{ color: '#FF3B30', fontSize: 12, fontWeight: '700' }}>Cancel Request</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* FAB to Apply Leave */}
      <TouchableOpacity style={styles.fab} onPress={() => setApplyVisible(true)}>
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Apply Leave Dialog */}
      <Portal>
        <Dialog visible={applyVisible} onDismiss={() => setApplyVisible(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.text, fontWeight: '700' }}>Apply for Leave</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 350 }}>
              {/* Type selector */}
              <TouchableOpacity style={[styles.selectBtn, { borderColor: colors.backgroundSelected }]} onPress={() => setTypePickerVisible(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="list-outline" size={18} color="#AF52DE" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: colors.text }}>
                    Leave Type: {LEAVE_TYPE_CONFIG[leaveType]?.label || leaveType}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Start Date Selector */}
              <TouchableOpacity 
                style={[styles.selectBtn, { borderColor: colors.backgroundSelected, marginTop: 12 }]} 
                onPress={() => setShowStartCalendar(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={18} color="#007AFF" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: colors.text }}>
                    Start Date: {startDate}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* End Date Selector */}
              <TouchableOpacity 
                style={[styles.selectBtn, { borderColor: colors.backgroundSelected, marginTop: 12 }]} 
                onPress={() => setShowEndCalendar(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={18} color="#FF9500" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: colors.text }}>
                    End Date: {endDate}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={{ marginTop: 12 }}>
                <ThemedText style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
                  Reason (Optional)
                </ThemedText>
                <TextInput
                  placeholder="Reason for taking leave..."
                  placeholderTextColor={colors.textSecondary}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, { 
                    color: colors.text, 
                    borderColor: colors.backgroundSelected, 
                    backgroundColor: colors.background, 
                    height: 70, 
                    textAlignVertical: 'top',
                    paddingTop: 8
                  }]}
                />
              </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
            <Button 
              textColor={colors.textSecondary} 
              onPress={() => setApplyVisible(false)}
              style={{ flex: 1, borderColor: colors.backgroundSelected, borderWidth: 1, borderRadius: 10 }}
            >
              Cancel
            </Button>
            <Button 
              buttonColor="#007AFF"
              textColor="#FFFFFF" 
              onPress={handleApply} 
              disabled={submitting}
              style={{ flex: 1, borderRadius: 10 }}
            >
              Apply
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Leave Type Picker Dialog */}
      <Portal>
        <Dialog visible={typePickerVisible} onDismiss={() => setTypePickerVisible(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.text, fontWeight: '700' }}>Select Leave Type</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            {Object.keys(LEAVE_TYPE_CONFIG).map((type) => (
              <TouchableOpacity 
                key={type}
                style={styles.pickerItem}
                onPress={() => {
                  setLeaveType(type);
                  setTypePickerVisible(false);
                }}
              >
                <ThemedText style={{ color: leaveType === type ? '#007AFF' : colors.text, fontWeight: leaveType === type ? '700' : '400' }}>
                  {LEAVE_TYPE_CONFIG[type].label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>

      {/* Start Date Calendar Dialog */}
      <Portal>
        <Dialog visible={showStartCalendar} onDismiss={() => setShowStartCalendar(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.text, fontWeight: '700' }}>Select Start Date</Dialog.Title>
          <Dialog.Content>
            <Calendar
              current={startDate}
              onDayPress={(day) => {
                setStartDate(day.dateString);
                setShowStartCalendar(false);
              }}
              markedDates={{
                [startDate]: { selected: true, selectedColor: '#007AFF' }
              }}
              theme={{
                calendarBackground: colors.backgroundElement,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: '#007AFF',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#007AFF',
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary + '50',
                monthTextColor: colors.text,
                arrowColor: '#007AFF',
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setShowStartCalendar(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* End Date Calendar Dialog */}
      <Portal>
        <Dialog visible={showEndCalendar} onDismiss={() => setShowEndCalendar(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.text, fontWeight: '700' }}>Select End Date</Dialog.Title>
          <Dialog.Content>
            <Calendar
              current={endDate}
              onDayPress={(day) => {
                setEndDate(day.dateString);
                setShowEndCalendar(false);
              }}
              markedDates={{
                [endDate]: { selected: true, selectedColor: '#FF9500' }
              }}
              theme={{
                calendarBackground: colors.backgroundElement,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: '#FF9500',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#FF9500',
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary + '50',
                monthTextColor: colors.text,
                arrowColor: '#FF9500',
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setShowEndCalendar(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Cancel Leave Confirmation Dialog */}
      <Portal>
        <Dialog visible={cancelVisible} onDismiss={() => setCancelVisible(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.text, fontWeight: '700', fontSize: 18 }}>Cancel Leave Request</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
              Are you sure you want to cancel this pending leave request? This action cannot be undone.
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
            <Button 
              textColor={colors.textSecondary} 
              onPress={() => setCancelVisible(false)}
              style={{ flex: 1, borderColor: colors.backgroundSelected, borderWidth: 1, borderRadius: 10 }}
            >
              No, Keep
            </Button>
            <Button 
              buttonColor="#FF3B30"
              textColor="#FFFFFF" 
              onPress={async () => {
                if (!selectedLeaveId) return;
                try {
                  setCancelling(true);
                  await api.put('/leaves', { id: selectedLeaveId, status: 'cancelled' });
                  setCancelVisible(false);
                  fetchMyLeaves();
                  showFeedback('Success', 'Leave request cancelled.', 'success');
                } catch (e) {
                  showFeedback('Error', 'Failed to cancel leave request.', 'error');
                } finally {
                  setCancelling(false);
                }
              }} 
              disabled={cancelling}
              style={{ flex: 1, borderRadius: 10 }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Feedback Dialog (Success/Error Alerts) */}
      <Portal>
        <Dialog visible={feedbackVisible} onDismiss={() => setFeedbackVisible(false)} style={{ backgroundColor: colors.backgroundElement, borderRadius: 20 }}>
          <View style={{ alignItems: 'center', paddingTop: 24, paddingHorizontal: 24 }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: feedbackType === 'success' ? '#34C75915' : '#FF3B3015',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Ionicons 
                name={feedbackType === 'success' ? 'checkmark-circle' : 'close-circle'} 
                size={36} 
                color={feedbackType === 'success' ? '#34C759' : '#FF3B30'} 
              />
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
              {feedbackTitle}
            </ThemedText>
            <ThemedText style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              {feedbackMessage}
            </ThemedText>
          </View>
          <Dialog.Actions style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16 }}>
            <Button 
              mode="contained"
              buttonColor={feedbackType === 'success' ? '#34C759' : '#FF3B30'}
              textColor="#FFFFFF"
              onPress={() => setFeedbackVisible(false)}
              style={{ width: '100%', borderRadius: 10 }}
            >
              Dismiss
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
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    flexShrink: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reasonBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  remarksBox: {
    marginTop: 10,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FF3B3012',
    borderWidth: 1,
    borderColor: '#FF3B3028',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    height: 44,
  },
  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
});
