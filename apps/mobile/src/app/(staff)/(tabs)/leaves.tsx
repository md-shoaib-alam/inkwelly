import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';

export default function StaffLeavesScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // New leave form state
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchLeaves = async () => {
    try {
      const data = await api.get('/leaves');
      setLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeaves();
    setIsRefreshing(false);
  };

  const handleApplyLeave = async () => {
    if (!startDate.trim() || !endDate.trim() || !reason.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await api.post('/leaves', {
        leaveType,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        reason: reason.trim()
      });
      Alert.alert('Success', 'Leave application submitted successfully!');
      setModalVisible(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit leave request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#34C759';
      case 'pending': return '#FF9500';
      case 'rejected': return '#FF3B30';
      case 'cancelled': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  // Compute stats
  const totalLeaves = 15;
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
  const balance = Math.max(0, totalLeaves - approvedLeaves);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={24} color="#FF9500" />
        <ThemedText style={styles.headerTitle}>Leave Management</ThemedText>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#FF9500']} />}
      >
        <TouchableOpacity style={styles.applyButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={20} color="#FFF" />
          <ThemedText style={styles.applyButtonText}>Apply for Leave</ThemedText>
        </TouchableOpacity>

        <View style={styles.summaryRow}>
          <SummaryCard label="Total" value={String(totalLeaves)} color="#007AFF" />
          <SummaryCard label="Used" value={String(approvedLeaves)} color="#34C759" />
          <SummaryCard label="Balance" value={String(balance)} color="#FF9500" />
        </View>

        {leaves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar" size={48} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 12 }} />
            <ThemedText style={{ color: colors.textSecondary }}>No leave requests found.</ThemedText>
          </View>
        ) : (
          leaves.map((leave) => (
            <View key={leave.id} style={[styles.leaveCard, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.leaveHeader}>
                <ThemedText style={styles.leaveType}>{leave.leaveType}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(leave.status) + '15' }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(leave.status) }]}>{leave.status.toUpperCase()}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.leaveDates}>
                {leave.startDate} to {leave.endDate}
              </ThemedText>
              <ThemedText style={[styles.leaveReason, { color: colors.textSecondary }]}>{leave.reason}</ThemedText>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Apply Leave Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Apply for Leave</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
              <ThemedText style={styles.label}>Leave Type</ThemedText>
              <View style={styles.pickerRow}>
                {['Sick Leave', 'Personal Leave', 'Annual Leave', 'Maternity Leave'].map((type: any) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.pickerChip, leaveType === type && { backgroundColor: '#FF9500', borderColor: '#FF9500' }]}
                    onPress={() => setLeaveType(type)}
                  >
                    <ThemedText style={[styles.pickerChipText, leaveType === type && { color: '#FFF' }]}>{type.toUpperCase()}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={styles.label}>Start Date</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />

              <ThemedText style={styles.label}>End Date</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />

              <ThemedText style={styles.label}>Reason</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.backgroundSelected }]}
                value={reason}
                onChangeText={setReason}
                placeholder="Why are you applying for leave?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleApplyLeave}>
                <ThemedText style={styles.submitButtonText}>Submit Application</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

function SummaryCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <View style={styles.summaryCard}>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText style={[styles.summaryValue, { color }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  applyButton: {
    flexDirection: 'row',
    backgroundColor: '#FF9500',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    opacity: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  leaveCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveType: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  leaveDates: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  leaveReason: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  pickerChipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 24,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
