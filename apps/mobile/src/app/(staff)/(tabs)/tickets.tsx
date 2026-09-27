import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';

export default function StaffTicketsScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // New ticket form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'general' | 'billing' | 'technical' | 'academics' | 'complaint' | 'other'>('technical');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const fetchTickets = async () => {
    try {
      const data = await api.get('/tickets');
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTickets();
    setIsRefreshing(false);
  };

  const handleCreateTicket = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'User authentication required');
      return;
    }
    try {
      await api.post('/tickets', {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        createdBy: user.id
      });
      Alert.alert('Success', 'Maintenance ticket raised successfully!');
      setModalVisible(false);
      setTitle('');
      setDescription('');
      fetchTickets();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to raise ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#007AFF';
      case 'in_progress': return '#FF9500';
      case 'resolved': return '#34C759';
      case 'closed': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="ticket-outline" size={24} color="#007AFF" />
        <ThemedText style={styles.headerTitle}>Service Tickets</ThemedText>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
      >
        <TouchableOpacity style={styles.newTicketButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <ThemedText style={styles.newTicketText}>Raise Maintenance Ticket</ThemedText>
        </TouchableOpacity>

        {tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 12 }} />
            <ThemedText style={{ color: colors.textSecondary }}>No service tickets logged.</ThemedText>
          </View>
        ) : (
          tickets.map((ticket) => (
            <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.ticketHeader}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) + '15' }]}>
                  <ThemedText style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>{ticket.priority.toUpperCase()}</ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '15' }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>{ticket.status.toUpperCase()}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.ticketSubject}>{ticket.title}</ThemedText>
              <ThemedText style={[styles.ticketDesc, { color: colors.textSecondary }]}>{ticket.description}</ThemedText>
              <View style={styles.ticketFooter}>
                <ThemedText style={[styles.ticketDate, { color: colors.textSecondary }]}>
                  Logged: {ticket.createdAt ? ticket.createdAt.slice(0, 10) : 'N/A'}
                </ThemedText>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Raise Maintenance Ticket Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Raise Maintenance Ticket</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
              <ThemedText style={styles.label}>Category</ThemedText>
              <View style={styles.pickerRow}>
                {['general', 'billing', 'technical', 'academics', 'feature_request', 'complaint'].map((cat: any) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pickerChip, category === cat && { backgroundColor: '#007AFF', borderColor: '#007AFF' }]}
                    onPress={() => setCategory(cat)}
                  >
                    <ThemedText style={[styles.pickerChipText, category === cat && { color: '#FFF' }]}>{cat.toUpperCase()}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={styles.label}>Priority</ThemedText>
              <View style={styles.pickerRow}>
                {['low', 'medium', 'high', 'urgent'].map((prio: any) => (
                  <TouchableOpacity
                    key={prio}
                    style={[styles.pickerChip, priority === prio && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]}
                    onPress={() => setPriority(prio)}
                  >
                    <ThemedText style={[styles.pickerChipText, priority === prio && { color: '#FFF' }]}>{prio.toUpperCase()}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={styles.label}>Title</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Brief summary of the issue"
                placeholderTextColor={colors.textSecondary}
              />

              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.backgroundSelected }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the maintenance / issue in detail..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleCreateTicket}>
                <ThemedText style={styles.submitButtonText}>Submit Ticket</ThemedText>
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
  newTicketButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  newTicketText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  ticketCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
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
  ticketSubject: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ticketDesc: {
    fontSize: 13,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  ticketDate: {
    fontSize: 12,
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
    backgroundColor: '#007AFF',
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
