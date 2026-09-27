import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Button } from 'react-native-paper';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { useRouter } from 'expo-router';

export default function StudentLeavesScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Apply Leave Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date Pickers visibility
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchLeaves = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/leaves`, { params: { userId: user.id } });
      setLeaves(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Failed to load leaves list:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaves();
  };

  const handleApplySubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the leave.');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('Error', 'End Date cannot be before Start Date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        leaveType,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        reason
      };
      await api.post('/leaves', payload);
      Alert.alert('Success', 'Leave request submitted successfully.');
      setModalVisible(false);
      setReason('');
      setStartDate(new Date());
      setEndDate(new Date());
      fetchLeaves();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this leave request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await api.put('/leaves', { id: leaveId, status: 'cancelled' });
              Alert.alert('Success', 'Leave request cancelled.');
              fetchLeaves();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel leave request.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#34C759';
      case 'rejected': return '#FF3B30';
      case 'cancelled': return '#8E8E93';
      default: return '#FF9500'; // pending
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      casual: 'Casual Leave',
      sick: 'Sick Leave',
      duty: 'Duty Leave'
    };
    return map[type] || type.toUpperCase();
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
        }
      >
        <TouchableOpacity 
          style={styles.applyButton} 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFF" style={{ marginRight: 6 }} />
          <ThemedText style={styles.applyBtnText}>Apply for Leave</ThemedText>
        </TouchableOpacity>

        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Leave History</ThemedText>

        {leaves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <ThemedText style={{ marginTop: 12, color: colors.textSecondary }}>No leave requests found.</ThemedText>
          </View>
        ) : (
          leaves.map((leave) => {
            const statusColor = getStatusColor(leave.status);
            const isPending = leave.status === 'pending';

            return (
              <View key={leave.id} style={[styles.leaveCard, { backgroundColor: colors.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.leaveType}>{getLeaveTypeLabel(leave.leaveType)}</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                    <ThemedText style={{ color: statusColor, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                      {leave.status}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <View style={styles.dateCol}>
                    <ThemedText style={[styles.dateLbl, { color: colors.textSecondary }]}>Start Date</ThemedText>
                    <ThemedText style={styles.dateVal}>{leave.startDate}</ThemedText>
                  </View>
                  <View style={styles.dateCol}>
                    <ThemedText style={[styles.dateLbl, { color: colors.textSecondary }]}>End Date</ThemedText>
                    <ThemedText style={styles.dateVal}>{leave.endDate}</ThemedText>
                  </View>
                </View>

                <View style={[styles.reasonWrapper, { backgroundColor: colors.background }]}>
                  <ThemedText style={[styles.reasonLbl, { color: colors.textSecondary }]}>Reason</ThemedText>
                  <ThemedText style={styles.reasonVal}>{leave.reason || 'No reason specified.'}</ThemedText>
                </View>

                {leave.approverRemarks ? (
                  <ThemedText style={[styles.remarksText, { color: colors.textSecondary }]}>
                    Remarks: {leave.approverRemarks}
                  </ThemedText>
                ) : null}

                {isPending && (
                  <TouchableOpacity 
                    style={styles.cancelBtn}
                    onPress={() => handleCancelLeave(leave.id)}
                  >
                    <ThemedText style={styles.cancelBtnText}>Cancel Request</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Apply Leave Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <ThemedView style={[styles.modalCard, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Apply for Leave</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.label}>Leave Type</ThemedText>
              <View style={styles.typeSelector}>
                {['casual', 'sick', 'duty'].map(t => (
                  <TouchableOpacity 
                    key={t}
                    style={[styles.typeBtn, leaveType === t && { backgroundColor: '#007AFF' }, { borderColor: colors.backgroundSelected }]}
                    onPress={() => setLeaveType(t)}
                  >
                    <ThemedText style={[styles.typeText, leaveType === t && { color: '#FFF' }]}>
                      {t.toUpperCase()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Start Date */}
              <ThemedText style={styles.label}>Start Date</ThemedText>
              <TouchableOpacity 
                style={[styles.datePickerBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#007AFF" style={{ marginRight: 8 }} />
                <ThemedText>{startDate.toDateString()}</ThemedText>
              </TouchableOpacity>
              <DatePickerModal
                visible={showStartPicker}
                onDismiss={() => setShowStartPicker(false)}
                value={startDate.toISOString().split('T')[0]}
                onSelectDate={(dateStr) => {
                  setStartDate(new Date(dateStr));
                }}
                title="Select Start Date"
              />

              {/* End Date */}
              <ThemedText style={styles.label}>End Date</ThemedText>
              <TouchableOpacity 
                style={[styles.datePickerBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#007AFF" style={{ marginRight: 8 }} />
                <ThemedText>{endDate.toDateString()}</ThemedText>
              </TouchableOpacity>
              <DatePickerModal
                visible={showEndPicker}
                onDismiss={() => setShowEndPicker(false)}
                value={endDate.toISOString().split('T')[0]}
                onSelectDate={(dateStr) => {
                  setEndDate(new Date(dateStr));
                }}
                title="Select End Date"
              />

              {/* Reason */}
              <ThemedText style={styles.label}>Reason</ThemedText>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Reason for leave request"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                style={[styles.reasonInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              />

              <TouchableOpacity 
                style={styles.submitBtn}
                onPress={handleApplySubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <ThemedText style={styles.submitBtnText}>Submit Request</ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  applyButton: {
    flexDirection: 'row',
    backgroundColor: '#34C759',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateLbl: {
    fontSize: 11,
    marginBottom: 2,
  },
  dateVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasonWrapper: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  reasonLbl: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonVal: {
    fontSize: 13,
    lineHeight: 18,
  },
  remarksText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    borderRadius: 8,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  typeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  datePickerBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  reasonInput: {
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
