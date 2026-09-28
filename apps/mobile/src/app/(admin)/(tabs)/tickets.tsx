import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';

// Sub-components
import { Ticket, TICKET_STATUS_CONFIG, TICKET_PRIORITY_CONFIG, TICKET_CATEGORY_CONFIG } from '@/modules/support/components/adminTickets/types';
import { TicketCard } from '@/modules/support/components/adminTickets/TicketCard';
import { TicketStatsView } from '@/modules/support/components/adminTickets/TicketStatsView';
import { CreateTicketDialog } from '@/modules/support/components/adminTickets/CreateTicketDialog';
import { TicketDetailModal } from '@/modules/support/components/adminTickets/TicketDetailModal';

export default function TicketsScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('open');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog & Modal visibility states
  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Filter pickers visibility
  const [priorityPickerVisible, setPriorityPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const res = await api.get('/tickets', { params });
      if (Array.isArray(res)) {
        setTickets(res);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    setLoading(true);
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  // Create Ticket handler
  const handleCreateTicket = async (data: { title: string; description: string; priority: string; category: string }) => {
    if (!user) return;
    try {
      setCreating(true);
      await api.post('/tickets', {
        ...data,
        createdBy: user.id,
      });
      setCreateVisible(false);
      fetchTickets();
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setCreating(false);
    }
  };

  const openTicketDetail = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setDetailVisible(true);
  };

  // Derive filtered list by search query locally
  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header Search & Quick Filters */}
      <View style={[styles.headerFilters, { borderBottomColor: colors.backgroundSelected, backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search tickets by keyword..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <View style={styles.filterTriggersRow}>
          <TouchableOpacity
            style={[styles.filterDropdown, { borderColor: colors.backgroundSelected }]}
            onPress={() => setPriorityPickerVisible(true)}
          >
            <ThemedText style={[styles.filterText, { color: colors.text }]}>
              {priorityFilter === 'all' ? 'All Priorities' : TICKET_PRIORITY_CONFIG[priorityFilter]?.label || priorityFilter}
            </ThemedText>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterDropdown, { borderColor: colors.backgroundSelected }]}
            onPress={() => setCategoryPickerVisible(true)}
          >
            <ThemedText style={[styles.filterText, { color: colors.text }]} numberOfLines={1}>
              {categoryFilter === 'all' ? 'All Categories' : TICKET_CATEGORY_CONFIG[categoryFilter]?.label || categoryFilter}
            </ThemedText>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Statistics Grid */}
      <View style={styles.statsContainer}>
        <TicketStatsView 
          tickets={tickets} 
          colors={colors}
          currentStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </View>

      {/* Ticket List */}
      {loading && tickets.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlashList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TicketCard 
              ticket={item}
              colors={colors}
              onPress={openTicketDetail}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={64} color={colors.backgroundSelected} />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                No support tickets found.
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Create Ticket FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: '#007AFF' }]}
        color="#FFF"
        onPress={() => setCreateVisible(true)}
      />

      {/* Create Dialog */}
      <CreateTicketDialog
        visible={createVisible}
        onDismiss={() => setCreateVisible(false)}
        submitting={creating}
        colors={colors}
        onSubmit={handleCreateTicket}
      />

      {/* Detail Modal */}
      <TicketDetailModal
        visible={detailVisible}
        onDismiss={() => {
          setDetailVisible(false);
          setSelectedTicketId(null);
        }}
        ticketId={selectedTicketId}
        colors={colors}
        currentUser={user}
        isAdmin={isAdmin}
        onTicketUpdated={fetchTickets}
      />

      {/* Priority Selector Modal */}
      <Portal>
        <Dialog
          visible={priorityPickerVisible}
          onDismiss={() => setPriorityPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Filter Priority</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <FlashList
              data={['all', 'low', 'medium', 'high', 'urgent']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setPriorityFilter(item);
                    setPriorityPickerVisible(false);
                  }}
                >
                  <ThemedText style={{ color: priorityFilter === item ? '#007AFF' : colors.text, fontWeight: priorityFilter === item ? '700' : 'normal', textTransform: 'capitalize' }}>
                    {item === 'all' ? 'All Priorities' : TICKET_PRIORITY_CONFIG[item]?.label || item}
                  </ThemedText>
                  {priorityFilter === item && <Ionicons name="checkmark" size={18} color="#007AFF" />}
                </TouchableOpacity>
              )}
            />
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setPriorityPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Category Selector Modal */}
        <Dialog
          visible={categoryPickerVisible}
          onDismiss={() => setCategoryPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Filter Category</Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <FlashList
              data={['all', 'general', 'billing', 'technical', 'academics', 'feature_request', 'complaint', 'other']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setCategoryFilter(item);
                    setCategoryPickerVisible(false);
                  }}
                >
                  <ThemedText style={{ color: categoryFilter === item ? '#007AFF' : colors.text, fontWeight: categoryFilter === item ? '700' : 'normal' }}>
                    {item === 'all' ? 'All Categories' : TICKET_CATEGORY_CONFIG[item]?.label || item}
                  </ThemedText>
                  {categoryFilter === item && <Ionicons name="checkmark" size={18} color="#007AFF" />}
                </TouchableOpacity>
              )}
            />
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setCategoryPickerVisible(false)}>Cancel</Button>
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
  headerFilters: {
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filterTriggersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterDropdown: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
});
