import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';

export default function ParentTicketsScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // New ticket form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'general' | 'billing' | 'technical' | 'academics' | 'complaint' | 'other'>('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const fetchTickets = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await api.get('/tickets');
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    await fetchTickets(false);
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
      Alert.alert('Success', 'Ticket raised successfully!');
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

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
        >
          {/* Raise New Ticket Button Skeleton */}
          <Skeleton width="100%" height={48} borderRadius={16} style={{ marginBottom: 20 }} />

          {/* Ticket Card Skeletons */}
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.ticketCard, { backgroundColor: colors.backgroundElement }]}>
                <View style={styles.ticketHeader}>
                  <Skeleton width="25%" height={16} borderRadius={6} />
                  <Skeleton width="20%" height={16} borderRadius={6} />
                </View>
                <Skeleton width="75%" height={18} style={{ marginBottom: 8 }} />
                <Skeleton width="90%" height={14} style={{ marginBottom: 16 }} />
                <View style={styles.ticketFooter}>
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
      >
        <TouchableOpacity style={styles.newTicketButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <ThemedText style={styles.newTicketText}>Raise New Ticket</ThemedText>
        </TouchableOpacity>

        {tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 12 }} />
            <ThemedText style={{ color: colors.textSecondary }}>No support tickets found.</ThemedText>
          </View>
        ) : (
          tickets.map((ticket) => (
            <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.ticketHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.backgroundSelected }]}>
                  <ThemedText style={styles.categoryText}>{ticket.category.toUpperCase()}</ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '15' }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>{ticket.status.toUpperCase()}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.ticketSubject}>{ticket.title}</ThemedText>
              <ThemedText style={[styles.ticketDesc, { color: colors.textSecondary }]}>{ticket.description}</ThemedText>
              <View style={styles.ticketFooter}>
                <ThemedText style={[styles.ticketDate, { color: colors.textSecondary }]}>
                  Raised: {ticket.createdAt ? ticket.createdAt.slice(0, 10) : 'N/A'}
                </ThemedText>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Raise Ticket Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Raise Support Ticket</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
              <ThemedText style={styles.label}>Category</ThemedText>
              <View style={styles.pickerRow}>
                {['general', 'billing', 'technical', 'academics', 'complaint'].map((cat: any) => (
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
                    style={[styles.pickerChip, priority === prio && { backgroundColor: '#FF9500', borderColor: '#FF9500' }]}
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
                placeholder="Describe the issue in detail..."
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
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    opacity: 0.7,
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
